import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { BlogPost, IBlogPost } from '../models/BlogPost';
import { authenticateToken, requireRole } from '../middleware/auth';

export const blogRouter = Router();

// ==================== VALIDATION SCHEMAS ====================

/**
 * Generates a URL-friendly slug from a given string
 */
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Allows safe HTML tags for rich text content
 */
const sanitizeContent = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'em', 'u', 's', 'b', 'i',
      'a', 'img',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'target', 'rel',
      'class', 'id',
      'width', 'height',
    ],
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Sanitizes plain text by stripping all HTML
 */
const sanitizePlainText = (text: string): string => {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] }).trim();
};

// Validation schema for creating a blog post
const createBlogPostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .transform(val => sanitizePlainText(val)),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(200, 'Slug cannot exceed 200 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)')
    .optional()
    .transform(val => val ? val.toLowerCase().trim() : undefined),
  content: z.string()
    .min(1, 'Content is required')
    .transform(val => sanitizeContent(val)),
  excerpt: z.string()
    .min(1, 'Excerpt is required')
    .max(500, 'Excerpt cannot exceed 500 characters')
    .transform(val => sanitizePlainText(val)),
  status: z.enum(['draft', 'published']).default('draft'),
  seoTitle: z.string()
    .max(70, 'SEO title should not exceed 70 characters')
    .optional()
    .transform(val => val ? sanitizePlainText(val) : undefined),
  metaDescription: z.string()
    .max(160, 'Meta description should not exceed 160 characters')
    .optional()
    .transform(val => val ? sanitizePlainText(val) : undefined),
  featuredImage: z.string().url().optional().nullable(),
  tags: z.array(z.string().transform(val => sanitizePlainText(val))).optional(),
});

// Validation schema for updating a blog post
const updateBlogPostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .transform(val => sanitizePlainText(val))
    .optional(),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(200, 'Slug cannot exceed 200 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-friendly')
    .transform(val => val.toLowerCase().trim())
    .optional(),
  content: z.string()
    .min(1, 'Content is required')
    .transform(val => sanitizeContent(val))
    .optional(),
  excerpt: z.string()
    .min(1, 'Excerpt is required')
    .max(500, 'Excerpt cannot exceed 500 characters')
    .transform(val => sanitizePlainText(val))
    .optional(),
  status: z.enum(['draft', 'published']).optional(),
  seoTitle: z.string()
    .max(70, 'SEO title should not exceed 70 characters')
    .transform(val => sanitizePlainText(val))
    .optional()
    .nullable(),
  metaDescription: z.string()
    .max(160, 'Meta description should not exceed 160 characters')
    .transform(val => sanitizePlainText(val))
    .optional()
    .nullable(),
  featuredImage: z.string().url().optional().nullable(),
  tags: z.array(z.string().transform(val => sanitizePlainText(val))).optional(),
});

// ==================== PUBLIC ROUTES ====================

/**
 * GET /api/super-admin/blog/public
 * Get all published blog posts (public access)
 */
blogRouter.get('/public', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '10', search, tag } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = { status: 'published' };

    // Search filter
    if (search && typeof search === 'string') {
      query.$text = { $search: search };
    }

    // Tag filter
    if (tag && typeof tag === 'string') {
      query.tags = tag;
    }

    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .select('-content') // Exclude full content for list view
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      BlogPost.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/super-admin/blog/public/:slug
 * Get a single published blog post by slug (public access)
 */
blogRouter.get('/public/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const post = await BlogPost.findOne({ slug, status: 'published' }).lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found',
        code: 'POST_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== PROTECTED ROUTES (Super Admin Only) ====================

/**
 * GET /api/super-admin/blog
 * Get all blog posts (Super Admin only)
 */
blogRouter.get('/', authenticateToken, requireRole('super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', status, search } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};

    // Status filter
    if (status && (status === 'draft' || status === 'published')) {
      query.status = status;
    }

    // Search filter
    if (search && typeof search === 'string' && search.trim()) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ];
    }

    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .select('-content') // Exclude full content for list view
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      BlogPost.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/super-admin/blog/:id
 * Get a single blog post by ID (Super Admin only)
 */
blogRouter.get('/:id', authenticateToken, requireRole('super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const post = await BlogPost.findById(id).lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found',
        code: 'POST_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/super-admin/blog
 * Create a new blog post (Super Admin only)
 */
blogRouter.post('/', authenticateToken, requireRole('super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const validationResult = createBlogPostSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const payload = validationResult.data;

    // Generate slug from title if not provided
    const slug = payload.slug || generateSlug(payload.title);

    // Check if slug already exists
    const existingPost = await BlogPost.findOne({ slug });
    if (existingPost) {
      return res.status(409).json({
        success: false,
        error: 'A blog post with this slug already exists',
        code: 'SLUG_DUPLICATE',
      });
    }

    // Create the blog post
    const blogPost = new BlogPost({
      ...payload,
      slug,
      author: {
        userId: req.user!._id,
        name: req.user!.name,
        email: req.user!.email,
      },
      publishedAt: payload.status === 'published' ? new Date() : undefined,
    });

    await blogPost.save();

    console.log(`[Blog] Created new post: "${blogPost.title}" by ${req.user!.email}`);

    res.status(201).json({
      success: true,
      data: blogPost.toObject(),
      message: 'Blog post created successfully',
    });
  } catch (error) {
    // Handle duplicate key error
    if ((error as any).code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'A blog post with this slug already exists',
        code: 'SLUG_DUPLICATE',
      });
    }
    next(error);
  }
});

/**
 * PUT /api/super-admin/blog/:id
 * Update an existing blog post (Super Admin only)
 */
blogRouter.put('/:id', authenticateToken, requireRole('super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Find the existing post
    const existingPost = await BlogPost.findById(id);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found',
        code: 'POST_NOT_FOUND',
      });
    }

    // Validate input
    const validationResult = updateBlogPostSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const payload = validationResult.data;

    // If slug is being changed, check for duplicates
    if (payload.slug && payload.slug !== existingPost.slug) {
      const duplicateSlug = await BlogPost.findOne({
        slug: payload.slug,
        _id: { $ne: id }
      });
      if (duplicateSlug) {
        return res.status(409).json({
          success: false,
          error: 'A blog post with this slug already exists',
          code: 'SLUG_DUPLICATE',
        });
      }
    }

    // Handle publishedAt when status changes to published
    const updateData: Record<string, unknown> = { ...payload };
    if (payload.status === 'published' && existingPost.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    // Update the post
    const updatedPost = await BlogPost.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    console.log(`[Blog] Updated post: "${updatedPost!.title}" by ${req.user!.email}`);

    res.json({
      success: true,
      data: updatedPost!.toObject(),
      message: 'Blog post updated successfully',
    });
  } catch (error) {
    // Handle duplicate key error
    if ((error as any).code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'A blog post with this slug already exists',
        code: 'SLUG_DUPLICATE',
      });
    }
    next(error);
  }
});

/**
 * DELETE /api/super-admin/blog/:id
 * Delete a blog post (Super Admin only)
 */
blogRouter.delete('/:id', authenticateToken, requireRole('super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const post = await BlogPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found',
        code: 'POST_NOT_FOUND',
      });
    }

    await BlogPost.findByIdAndDelete(id);

    console.log(`[Blog] Deleted post: "${post.title}" by ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Blog post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/super-admin/blog/generate-slug
 * Generate a slug from a title (Super Admin only)
 */
blogRouter.post('/generate-slug', authenticateToken, requireRole('super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Title is required',
        code: 'VALIDATION_ERROR',
      });
    }

    let slug = generateSlug(title);

    // Check if slug exists and append number if needed
    let counter = 1;
    let finalSlug = slug;
    while (await BlogPost.findOne({ slug: finalSlug })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    res.json({
      success: true,
      data: { slug: finalSlug },
    });
  } catch (error) {
    next(error);
  }
});

export default blogRouter;
