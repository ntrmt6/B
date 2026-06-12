/**
 * backfill-embeddings.ts
 *
 * One-time migration script that finds all existing products in MongoDB
 * missing a vector embedding and generates one via the Gemini API.
 *
 * Usage:
 *   npx ts-node --esm backend/src/scripts/backfill-embeddings.ts
 *
 * Required environment variables (set in .env or export before running):
 *   MONGODB_URI      – MongoDB connection string
 *   MONGODB_DB_NAME  – Database name
 *   GEMINI_API_KEY   – Google Gemini API key
 */

import { config } from 'dotenv';
config();

import { getDatabase, disconnectMongo } from '../db/mongo';
import { generateProductEmbedding } from '../utils/embeddings';

// ---------------------------------------------------------------------------
// Rate-limit settings – Gemini free tier allows 15 requests per minute.
// We process in batches of 15 and pause for 60 seconds between batches.
// ---------------------------------------------------------------------------
const BATCH_SIZE = 15;
const BATCH_PAUSE_MS = 60_000; // 60 seconds

/** Simple sleep helper that returns a promise resolved after `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface TenantProductsDoc {
  tenantId: string;
  key: string;
  data: Array<{
    id: number;
    name?: string;
    title?: string;
    description?: string;
    price?: number;
    category?: string;
    image?: string;
    galleryImages?: string[];
    status?: string;
    stock?: number;
  }>;
}

interface ProductEmbeddingDoc {
  tenantId: string;
  productId: number;
  embedding: number[];
}

async function backfillEmbeddings() {
  console.log('\n🚀 Starting embedding backfill migration...\n');

  // ── Validate GEMINI_API_KEY ───────────────────────────────────────────────
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set. Aborting.');
    process.exit(1);
  }

  const db = await getDatabase();

  // ── 1. Fetch every tenant's product catalogue ─────────────────────────────
  const tenantProductDocs = await db
    .collection<TenantProductsDoc>('tenant_data')
    .find({ key: 'products' })
    .toArray();

  if (tenantProductDocs.length === 0) {
    console.log('ℹ️  No product catalogues found in tenant_data. Nothing to do.');
    await disconnectMongo();
    return;
  }

  console.log(`📦 Found product catalogues for ${tenantProductDocs.length} tenant(s).\n`);

  // ── 2. Build a flat list of (tenant, product) pairs missing embeddings ────
  const embeddingsCollection = db.collection<ProductEmbeddingDoc>('product_embeddings');

  interface ProductToProcess {
    tenantId: string;
    product: TenantProductsDoc['data'][number];
  }

  // Fetch ALL existing embeddings in a single query to avoid N+1 queries
  const allExistingEmbeddings = await embeddingsCollection
    .find(
      { embedding: { $exists: true } },
      { projection: { tenantId: 1, productId: 1 } }
    )
    .toArray();

  // Group existing embedding IDs by tenant for fast lookup
  const embeddedByTenant = new Map<string, Set<number>>();
  for (const emb of allExistingEmbeddings) {
    if (!embeddedByTenant.has(emb.tenantId)) {
      embeddedByTenant.set(emb.tenantId, new Set());
    }
    embeddedByTenant.get(emb.tenantId)!.add(emb.productId);
  }

  const productsToProcess: ProductToProcess[] = [];

  for (const doc of tenantProductDocs) {
    if (!Array.isArray(doc.data) || doc.data.length === 0) continue;

    const embeddedProductIds = embeddedByTenant.get(doc.tenantId) ?? new Set();

    for (const product of doc.data) {
      if (!embeddedProductIds.has(product.id)) {
        productsToProcess.push({ tenantId: doc.tenantId, product });
      }
    }
  }

  const totalProducts = productsToProcess.length;
  if (totalProducts === 0) {
    console.log('✅ All products already have embeddings. Nothing to do.');
    await disconnectMongo();
    return;
  }

  console.log(`🔍 Found ${totalProducts} product(s) missing embeddings.\n`);

  // ── 3. Process in batches to respect Gemini free-tier rate limits ──────────
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < totalProducts; i += BATCH_SIZE) {
    const batch = productsToProcess.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(totalProducts / BATCH_SIZE);

    console.log(`── Batch ${batchNumber} of ${totalBatches} (${batch.length} products) ──`);

    for (let j = 0; j < batch.length; j++) {
      const { tenantId, product } = batch[j];
      const overallIndex = i + j + 1;

      console.log(
        `  Processing product ${overallIndex} of ${totalProducts} ` +
          `(ID: ${product.id}, Tenant: ${tenantId})...`
      );

      try {
        const embedding = await generateProductEmbedding(product);

        if (!embedding) {
          console.log(`  ⚠️  Skipped product ${product.id} – embedding generation returned null.`);
          skipCount++;
          continue;
        }

        await embeddingsCollection.updateOne(
          { tenantId, productId: product.id },
          {
            $set: {
              tenantId,
              productId: product.id,
              name: product.name || product.title || '',
              description: product.description || '',
              price: product.price ?? 0,
              image: product.image || '',
              galleryImages: product.galleryImages || [],
              category: product.category || '',
              status: product.status || 'Active',
              stock: product.stock ?? 0,
              embedding,
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );

        console.log(`  ✅ Successfully updated product ID ${product.id}.`);
        successCount++;
      } catch (err) {
        console.error(`  ❌ Error processing product ${product.id}:`, err);
        errorCount++;
      }
    }

    // Pause between batches (skip pause after the last batch)
    const isLastBatch = i + BATCH_SIZE >= totalProducts;
    if (!isLastBatch) {
      console.log(`\n⏳ Rate limit pause – waiting ${BATCH_PAUSE_MS / 1000}s before next batch...\n`);
      await sleep(BATCH_PAUSE_MS);
    }
  }

  // ── 4. Summary ────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log('📊 Backfill Summary');
  console.log('══════════════════════════════════════════');
  console.log(`  Total products processed : ${totalProducts}`);
  console.log(`  ✅ Successfully embedded : ${successCount}`);
  console.log(`  ⚠️  Skipped (null result) : ${skipCount}`);
  console.log(`  ❌ Errors                : ${errorCount}`);
  console.log('══════════════════════════════════════════\n');

  await disconnectMongo();
  console.log('🏁 Migration complete. Database connection closed.\n');
}

// ── Entry point ──────────────────────────────────────────────────────────────
backfillEmbeddings().catch((err) => {
  console.error('💥 Unhandled error during migration:', err);
  disconnectMongo().finally(() => process.exit(1));
});
