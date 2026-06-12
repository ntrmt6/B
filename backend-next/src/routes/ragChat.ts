import { Router, Request, Response, NextFunction } from 'express';
import { getDatabase } from '../db/mongo';
import { GoogleGenerativeAI, FunctionDeclaration } from '@google/generative-ai';
import { generateQueryEmbedding } from '../utils/embeddings';
import { KeyManager, backoffWithJitter } from '../utils/keyManager';
import PQueue from 'p-queue';

export const ragChatRouter = Router();

const keyManager = new KeyManager('RAG Chat');

// ── Request Queue: Rate Limiting & Throttling ────────────────────────────────

const requestQueue = new PQueue({
  concurrency: 1,
  interval: 4_000, // 1 request every 4 seconds ≈ 15 RPM, within Gemini Free Tier limit
  intervalCap: 1,
});

// ── History Helpers ──────────────────────────────────────────────────────────

const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_TOKENS = 4000; // approximate token budget for history

/** Rough token count: ~4 chars per token for English, ~2 for Bangla. Use 3 as average. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

interface ChatMessagePayload {
  role: 'user' | 'model';
  text: string;
}

/** Truncate history to last N messages, then further trim by token budget. */
function truncateHistory(history: ChatMessagePayload[]): ChatMessagePayload[] {
  // First: sliding window — keep last MAX_HISTORY_MESSAGES
  let trimmed = history.slice(-MAX_HISTORY_MESSAGES);

  // Second: trim by token count from most recent backward
  let totalTokens = 0;
  const result: ChatMessagePayload[] = [];
  for (let i = trimmed.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(trimmed[i].text);
    if (totalTokens + msgTokens > MAX_HISTORY_TOKENS) break;
    totalTokens += msgTokens;
    result.unshift(trimmed[i]);
  }
  return result;
}

// ── Tool Declarations ───────────────────────────────────────────────────────

const getProductsTool: FunctionDeclaration = {
  name: 'get_products',
  description:
    'Search for products by query text with optional price range filtering. Use this when a user asks about products, mentions a budget, or wants to browse items.',
  parameters: {
    type: 'OBJECT' as any,
    properties: {
      query: {
        type: 'STRING' as any,
        description: 'The search query describing what the user is looking for',
      },
      minPrice: {
        type: 'NUMBER' as any,
        description: 'Minimum price in BDT. Use when user specifies a lower budget bound.',
      },
      maxPrice: {
        type: 'NUMBER' as any,
        description: 'Maximum price in BDT. Use when user specifies a budget limit (e.g. "under 5000 tk").',
      },
    },
    required: ['query'],
  } as any,
};

const displayProductMediaTool: FunctionDeclaration = {
  name: 'display_product_media',
  description:
    'Show the image and price of a specific product. Use this whenever a product has an image URL available — always prefer showing visuals rather than just describing a product with text.',
  parameters: {
    type: 'OBJECT' as any,
    properties: {
      productName: {
        type: 'STRING' as any,
        description: 'The name of the product to display visually',
      },
    },
    required: ['productName'],
  } as any,
};

const createCheckoutSessionTool: FunctionDeclaration = {
  name: 'create_checkout_session',
  description:
    'Generate a secure checkout link for a product so the customer can purchase it. Use this when the user confirms they want to buy a product or when you are closing a sale.',
  parameters: {
    type: 'OBJECT' as any,
    properties: {
      productId: {
        type: 'NUMBER' as any,
        description: 'The unique ID of the product to create a checkout session for',
      },
    },
    required: ['productId'],
  } as any,
};

interface ProductEmbeddingDoc {
  tenantId: string;
  productId: number;
  name: string;
  description: string;
  price: number;
  image: string;
  galleryImages?: string[];
  unfilteredImages?: { url: string; uploadedAt: string }[];
  hasUnfilteredImages?: boolean;
  category: string;
  status: string;
  stock: number;
  embedding: number[];
}

/**
 * Build a compound filter for $vectorSearch that restricts by tenantId and
 * optional price range simultaneously.
 */
function buildVectorSearchFilter(
  tenantId: string,
  minPrice?: number,
  maxPrice?: number
): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [{ tenantId }];

  if (minPrice != null) {
    conditions.push({ price: { $gte: minPrice } });
  }
  if (maxPrice != null) {
    conditions.push({ price: { $lte: maxPrice } });
  }

  // When there is only the tenantId condition we can use a simple filter
  if (conditions.length === 1) return conditions[0];

  return { $and: conditions };
}

/**
 * Perform a vector search using MongoDB Atlas $vectorSearch, falling back to
 * a text-based search when vector search is unavailable.
 * Supports optional minPrice/maxPrice for compound filtering.
 */
async function findRelevantProducts(
  tenantId: string,
  queryEmbedding: number[] | null,
  queryText: string,
  limit = 5,
  minPrice?: number,
  maxPrice?: number
): Promise<ProductEmbeddingDoc[]> {
  const db = await getDatabase();

  // Try vector search first (requires Atlas Vector Search index)
  if (queryEmbedding) {
    try {
      const filter = buildVectorSearchFilter(tenantId, minPrice, maxPrice);

      const results = await db
        .collection<ProductEmbeddingDoc>('product_embeddings')
        .aggregate<ProductEmbeddingDoc>([
          {
            $vectorSearch: {
              index: 'product_embedding_index',
              path: 'embedding',
              queryVector: queryEmbedding,
              numCandidates: 50,
              limit,
              filter,
            },
          },
          {
            $project: {
              tenantId: 1,
              productId: 1,
              name: 1,
              description: 1,
              price: 1,
              image: 1,
              galleryImages: 1,
              unfilteredImages: 1,
              hasUnfilteredImages: 1,
              category: 1,
              status: 1,
              stock: 1,
              score: { $meta: 'vectorSearchScore' },
            },
          },
        ])
        .toArray();

      if (results.length > 0) return results;
    } catch {
      // Vector search index may not exist — fall through to text search
    }
  }

  // Fallback: regex-based keyword search on the embeddings collection
  const keywords = queryText
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const baseFilter: Record<string, unknown> = { tenantId };
  const priceFilter: Record<string, unknown> = {};
  if (minPrice != null) priceFilter.$gte = minPrice;
  if (maxPrice != null) priceFilter.$lte = maxPrice;
  if (Object.keys(priceFilter).length > 0) baseFilter.price = priceFilter;

  if (keywords.length === 0) {
    return db
      .collection<ProductEmbeddingDoc>('product_embeddings')
      .find(baseFilter)
      .limit(limit)
      .toArray();
  }

  const orConditions = keywords.map((kw) => ({
    $or: [
      { name: { $regex: kw, $options: 'i' } },
      { description: { $regex: kw, $options: 'i' } },
      { category: { $regex: kw, $options: 'i' } },
    ],
  }));

  return db
    .collection<ProductEmbeddingDoc>('product_embeddings')
    .find({ ...baseFilter, $or: orConditions.flat().map((c) => c.$or).flat() })
    .limit(limit)
    .toArray();
}

/**
 * Build product context string for the LLM from retrieved products.
 * Includes productId so the AI can reference them for checkout.
 */
function buildProductContext(products: ProductEmbeddingDoc[]): string {
  if (products.length === 0) return 'No products found matching the query.';

  return products
    .map(
      (p, i) => {
        let context =
          `Product ${i + 1} [ID: ${p.productId}]: "${p.name}" — ${p.description || 'No description'}. ` +
          `Price: ৳${p.price}. Category: ${p.category || 'N/A'}. ` +
          `Stock: ${p.stock ?? 'N/A'}. Image: ${p.image || 'No image'}`;
        if (p.unfilteredImages && p.unfilteredImages.length > 0) {
          context += `. Real/Unfiltered Images Available: ${p.unfilteredImages.map((img) => img.url).join(', ')}`;
        }
        return context;
      }
    )
    .join('\n');
}

/**
 * Find a product by name from the retrieved results (case-insensitive partial match).
 */
function findProductByName(
  products: ProductEmbeddingDoc[],
  name: string
): ProductEmbeddingDoc | undefined {
  const lower = name.toLowerCase();
  return products.find(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      lower.includes(p.name.toLowerCase())
  );
}

// POST /api/chat
ragChatRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, shopId, history } = req.body as {
      message: string;
      shopId: string;
      history?: ChatMessagePayload[];
    };

    if (!message || !shopId) {
      return res.status(400).json({ error: 'message and shopId are required' });
    }

    if (!keyManager.hasKeys) {
      return res.status(503).json({ error: 'AI service is not configured' });
    }

    // 1. Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(message);

    // 2. Find relevant products (vector search with text fallback)
    let relevantProducts = await findRelevantProducts(shopId, queryEmbedding, message);

    // 2b. Empty result handling — fetch popular/recent items instead
    let noExactMatch = false;
    if (relevantProducts.length === 0) {
      noExactMatch = true;
      relevantProducts = await findRelevantProducts(shopId, null, '', 5);
    }

    const productContext = buildProductContext(relevantProducts);

    // 3. Truncate incoming history (sliding window + token budget)
    const safeHistory = truncateHistory(history || []);

    // 4. Build system instruction (re-injected fresh for every request)
    const systemInstruction = `You are a helpful, friendly, and sales-oriented AI shopping assistant for an online store. Your job is to help customers discover products, view them visually, and complete purchases.

CORE RULES:
- Only answer questions based on the product context provided below. Do not make up products or information.
- If no matching products were found, do NOT say "I don't know." Instead, suggest: "I couldn't find exactly that, but here are our most popular items instead." and present the fallback products listed below.
- Be concise, helpful, and friendly. Use Bangla or English depending on the user's language.
- Format prices in BDT (৳).

PRICE AWARENESS:
- If a user mentions a budget, price limit, or range (e.g., "under 5000 tk", "between 1000 and 3000"), you MUST call the get_products tool with the appropriate minPrice and/or maxPrice values.
- Always extract numeric price values from the user's message and pass them to get_products.

PROACTIVE RECOMMENDATION:
- When you find a single matching product, also check the context for 1-2 related or complementary products and suggest them to increase order value.
- Use phrases like "You might also like…" or "Customers also bought…".

VISUAL-FIRST:
- NEVER just describe a product with text alone. If a product has an image URL in the context, you MUST use the display_product_media tool to show it visually.
- Always prefer showing product images over describing them.

REAL/UNFILTERED IMAGES:
- If a user asks for "real pictures," "original photos," "unfiltered images," "authentic photos," or similar requests, you MUST check the unfilteredImages field in the product context.
- If the product has Real/Unfiltered Images Available in its context, you MUST prioritize showing those images using the display_product_media tool instead of the main product thumbnail.
- Let the customer know these are authentic, unfiltered photos of the actual product.

CLOSING THE SALE:
- After answering questions about a product, proactively ask: "Would you like me to generate a secure checkout link for this [Product Name]?"
- When the user confirms, use the create_checkout_session tool with the product's ID.

${noExactMatch ? 'NOTE: No exact matches were found for the user query. The products below are popular/recent items. Present them as suggestions.\n' : ''}AVAILABLE PRODUCTS:
${productContext}

Reminder: You have access to product tools. Use them for images or price queries.`;

    // Build conversation history for Gemini
    const chatHistory = safeHistory.map((msg) => ({
      role: msg.role as 'user' | 'model',
      parts: [{ text: msg.text }],
    }));

    // 5. Execute Gemini call via queued multi-key failover
    const result = await requestQueue.add(() =>
      callGeminiWithFailover(systemInstruction, chatHistory, message)
    );

    if (!result) {
      return res.status(503).json({ error: 'AI service is temporarily unavailable. Please try again shortly.' });
    }

    const { response, chat } = result;

    // 6. Check for function calls
    const functionCall = response.functionCalls()?.[0];

    if (functionCall) {
      // ── get_products ────────────────────────────────────────────────
      if (functionCall.name === 'get_products') {
        const args = functionCall.args as {
          query?: string;
          minPrice?: number;
          maxPrice?: number;
        };

        const searchQuery = args.query || message;
        const searchEmbedding = await generateQueryEmbedding(searchQuery);
        const filteredProducts = await findRelevantProducts(
          shopId,
          searchEmbedding,
          searchQuery,
          5,
          args.minPrice,
          args.maxPrice
        );

        const productList = filteredProducts.map((p) => ({
          id: p.productId,
          name: p.name,
          price: p.price,
          description: p.description || '',
          image: p.image || '',
        }));

        const fnResult = await chat.sendMessage([
          {
            functionResponse: {
              name: 'get_products',
              response: {
                products: productList,
                count: productList.length,
              },
            },
          },
        ]);

        return res.json({ reply: fnResult.response.text() || 'Here are the products I found.' });
      }

      // ── display_product_media ───────────────────────────────────────
      if (functionCall.name === 'display_product_media') {
        const requestedName =
          (functionCall.args as { productName?: string })?.productName || '';

        const match = findProductByName(relevantProducts, requestedName);

        if (match && match.image) {
          // Check if the user is asking for real/unfiltered images
          const lowerMessage = message.toLowerCase();
          const wantsRealImage =
            lowerMessage.includes('real') ||
            lowerMessage.includes('unfiltered') ||
            lowerMessage.includes('authentic') ||
            lowerMessage.includes('original photo') ||
            lowerMessage.includes('actual photo');

          // Use unfiltered image if available and requested
          const hasUnfiltered = match.unfilteredImages && match.unfilteredImages.length > 0;
          const displayImageUrl = (wantsRealImage && hasUnfiltered)
            ? match.unfilteredImages?.[0]?.url ?? match.image
            : match.image;
          const isUnfilteredImage = wantsRealImage && hasUnfiltered;

          const fnResult = await chat.sendMessage([
            {
              functionResponse: {
                name: 'display_product_media',
                response: {
                  productName: match.name,
                  imageUrl: displayImageUrl,
                  price: match.price,
                  productId: match.productId,
                  found: true,
                  isUnfilteredImage,
                },
              },
            },
          ]);

          const wrapperText = fnResult.response.text() || `Here's ${match.name}:`;

          return res.json({
            reply: wrapperText,
            image_card: {
              type: 'image_card' as const,
              url: displayImageUrl,
              alt: isUnfilteredImage ? `${match.name} (Authentic Shot)` : match.name,
              price: match.price,
              productId: match.productId,
            },
          });
        }

        // Product not found or no image
        const fnResult = await chat.sendMessage([
          {
            functionResponse: {
              name: 'display_product_media',
              response: { productName: requestedName, found: false },
            },
          },
        ]);

        return res.json({
          reply:
            fnResult.response.text() ||
            "Sorry, I couldn't find an image for that product.",
        });
      }

      // ── create_checkout_session ─────────────────────────────────────
      if (functionCall.name === 'create_checkout_session') {
        const productId =
          (functionCall.args as { productId?: number })?.productId;

        // Validate that the product belongs to this tenant's context
        const match = relevantProducts.find((p) => p.productId === productId);

        if (!match) {
          const fnResult = await chat.sendMessage([
            {
              functionResponse: {
                name: 'create_checkout_session',
                response: { success: false, error: 'Product not found in this store.' },
              },
            },
          ]);

          return res.json({
            reply: fnResult.response.text() || "Sorry, I couldn't find that product in this store.",
          });
        }

        const checkoutUrl = `/checkout/${productId}`;

        const fnResult = await chat.sendMessage([
          {
            functionResponse: {
              name: 'create_checkout_session',
              response: {
                checkoutUrl,
                productName: match.name,
                productId,
                success: true,
              },
            },
          },
        ]);

        const wrapperText =
          fnResult.response.text() ||
          `Your checkout link for ${match.name} is ready!`;

        return res.json({
          reply: wrapperText,
          checkout_action: {
            type: 'checkout_action' as const,
            url: checkoutUrl,
            label: `Buy Now — ${match.name}`,
            productId,
          },
        });
      }
    }

    // 7. Standard text response
    const textReply =
      response.text() ||
      "I'm sorry, I couldn't generate a response. Please try again.";

    return res.json({ reply: textReply });
  } catch (error) {
    console.error('[RAG Chat] Error:', error);
    next(error);
  }
});

// ── Gemini Multi-Key Failover ────────────────────────────────────────────────

const MAX_RETRIES = 3;

interface GeminiCallResult {
  response: any;
  chat: any;
}

/** Try calling Gemini with each available key, retrying with backoff on 429/500 errors. */
async function callGeminiWithFailover(
  systemInstruction: string,
  chatHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  message: string
): Promise<GeminiCallResult | null> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const apiKey = keyManager.getNextKey();
    if (!apiKey) {
      console.warn('[RAG Chat] All API keys are blacklisted — waiting before retry');
      await backoffWithJitter(attempt);
      continue;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction,
        tools: [
          {
            functionDeclarations: [
              getProductsTool,
              displayProductMediaTool,
              createCheckoutSessionTool,
            ],
          },
        ],
      });

      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessage(message);
      return { response: result.response, chat };
    } catch (err: any) {
      const status = err?.status || err?.httpError?.status || err?.response?.status;
      if (status === 429 || status === 500) {
        keyManager.blacklistKey(apiKey);
        console.warn(`[RAG Chat] Key returned ${status}, retrying with next key (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await backoffWithJitter(attempt);
      } else {
        // Non-retryable error — throw immediately
        throw err;
      }
    }
  }

  console.error('[RAG Chat] All keys exhausted after retries');
  return null;
}

export default ragChatRouter;
