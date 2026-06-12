import { KeyManager } from './keyManager';

const keyManager = new KeyManager('Embeddings');

/**
 * Generate a vector embedding for a product using the Gemini text embedding model.
 * Combines title/name, description, and price into a single text for embedding.
 */
export async function generateProductEmbedding(product: {
  name?: string;
  title?: string;
  description?: string;
  price?: number;
  category?: string;
}): Promise<number[] | null> {
  if (!keyManager.hasKeys) {
    console.warn('[Embeddings] No GEMINI API keys set, skipping embedding generation');
    return null;
  }

  const parts: string[] = [];
  const productName = product.name || product.title || '';
  if (productName) parts.push(productName);
  if (product.description) parts.push(product.description);
  if (product.category) parts.push(`Category: ${product.category}`);
  if (product.price != null) parts.push(`Price: ${product.price}`);

  const text = parts.join('. ');
  if (!text.trim()) return null;

  try {
    const entry = keyManager.getGenAI();
    if (!entry) {
      console.warn('[Embeddings] All API keys are currently blacklisted');
      return null;
    }
    // UPDATED: Using the current 3072-dimension model
    const model = entry.genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('[Embeddings] Failed to generate embedding:', error);
    return null;
  }
}

/**
 * Generate an embedding for a user query string.
 */
export async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  if (!keyManager.hasKeys) {
    console.warn('[Embeddings] No GEMINI API keys set, skipping query embedding');
    return null;
  }

  if (!query.trim()) return null;

  try {
    const entry = keyManager.getGenAI();
    if (!entry) {
      console.warn('[Embeddings] All API keys are currently blacklisted');
      return null;
    }
    // UPDATED: Using the current 3072-dimension model
    const model = entry.genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent(query);
    return result.embedding.values;
  } catch (error) {
    console.error('[Embeddings] Failed to generate query embedding:', error);
    return null;
  }
}
