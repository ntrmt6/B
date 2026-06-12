import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { getDatabase } from '../db/mongo';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { generateProductEmbedding } from '../utils/embeddings';

export const unfilteredImagesRouter = Router();

// ---------------------------------------------------------------------------
// Rate limiter (in-memory, no external dependency)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window
const RATE_LIMIT_MAX = 20; // max 20 uploads per minute per user

const checkRateLimit = (key: string): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
};

// Purge stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60_000);

// Multer setup: memory storage, 5MB max
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Rate limiter middleware
const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const rateLimitKey = (req as any).user?._id || req.ip || 'anonymous';
  if (!checkRateLimit(rateLimitKey)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  next();
};

/**
 * POST /api/tenant-data/:tenantId/unfiltered-images
 *
 * Upload an unfiltered/authentic product image.
 * Accepts multipart/form-data with:
 *   - file: the image file
 *   - productId: the product ID to attach the image to
 *   - imageUrl: (alternative) an already-uploaded image URL to register
 *
 * Requires authentication and admin role.
 * Validates that the tenantId from the URL matches the authenticated user's tenant.
 */
unfilteredImagesRouter.post(
  '/:tenantId/unfiltered-images',
  authenticateToken,
  requireAdmin,
  rateLimitMiddleware,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const { productId, imageUrl } = req.body;

      if (!tenantId) {
        return res.status(400).json({ error: 'tenantId is required' });
      }

      if (!productId) {
        return res.status(400).json({ error: 'productId is required' });
      }

      // Tenant validation: ensure the authenticated user belongs to this tenant
      const userTenantId = (req as any).user?.tenantId;
      if (userTenantId && userTenantId !== tenantId) {
        return res.status(403).json({ error: 'Cross-tenant access denied' });
      }

      // Determine the image URL
      let finalImageUrl = imageUrl;

      if (req.file && !finalImageUrl) {
        // If a file was uploaded directly, we need to save it via the
        // existing upload infrastructure. For now we support passing the
        // already-uploaded imageUrl from the frontend which uses the
        // existing upload service.
        return res.status(400).json({
          error: 'Direct file upload not supported on this endpoint. Upload the file first via /api/upload and pass the imageUrl.',
        });
      }

      if (!finalImageUrl) {
        return res.status(400).json({ error: 'imageUrl is required' });
      }

      const numericProductId = Number(productId);
      if (isNaN(numericProductId)) {
        return res.status(400).json({ error: 'productId must be a valid number' });
      }

      const db = await getDatabase();

      // 1. Update product in tenant_data to add the unfiltered image
      const tenantDataCollection = db.collection('tenant_data');
      const productsDoc = await tenantDataCollection.findOne({
        tenantId,
        key: 'products',
      });

      if (!productsDoc || !Array.isArray(productsDoc.data)) {
        return res.status(404).json({ error: 'Products not found for this tenant' });
      }

      const products = productsDoc.data;
      const productIndex = products.findIndex((p: any) => p.id === numericProductId);

      if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const unfilteredEntry = {
        url: finalImageUrl,
        uploadedAt: new Date().toISOString(),
      };

      // Initialize unfilteredImages array if not present
      if (!Array.isArray(products[productIndex].unfilteredImages)) {
        products[productIndex].unfilteredImages = [];
      }
      products[productIndex].unfilteredImages.push(unfilteredEntry);

      // Save updated products back
      await tenantDataCollection.updateOne(
        { tenantId, key: 'products' },
        { $set: { data: products } }
      );

      // 2. Update product_embeddings to include unfiltered image metadata
      const embeddingsCollection = db.collection('product_embeddings');
      const product = products[productIndex];
      const unfilteredUrls = product.unfilteredImages.map((img: any) => img.url);

      await embeddingsCollection.updateOne(
        { tenantId, productId: numericProductId },
        {
          $set: {
            unfilteredImages: product.unfilteredImages,
            hasUnfilteredImages: true,
            updatedAt: new Date(),
          },
        }
      );

      // 3. Optionally trigger embedding refresh to update vector search metadata
      try {
        const embedding = await generateProductEmbedding({
          name: product.name || product.title || '',
          description: `${product.description || ''}. This product includes real, unfiltered photos showing authentic details.`,
          price: product.price,
          category: product.category || '',
        });

        if (embedding) {
          await embeddingsCollection.updateOne(
            { tenantId, productId: numericProductId },
            { $set: { embedding } }
          );
        }
      } catch (embErr) {
        console.error(`[UnfilteredImages] Embedding refresh failed for product ${numericProductId}:`, embErr);
        // Non-fatal: continue even if embedding refresh fails
      }

      console.log(`[UnfilteredImages] Added unfiltered image for product ${numericProductId} in tenant ${tenantId}`);

      return res.json({
        success: true,
        unfilteredImage: unfilteredEntry,
        totalUnfilteredImages: product.unfilteredImages.length,
      });
    } catch (error) {
      console.error('[UnfilteredImages] Error:', error);
      next(error);
    }
  }
);

export default unfilteredImagesRouter;
