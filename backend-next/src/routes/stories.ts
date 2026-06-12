import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getTenantData, setTenantData } from '../services/tenantDataService';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// ─── Zod Schemas ───
const storySchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().optional().transform(v => (v === '' ? undefined : v)),
  productId: z.number().optional(),
  duration: z.number().min(1).max(120).default(30),
  order: z.number().default(0),
  active: z.boolean().default(true),
});

const createStorySchema = storySchema.omit({ id: true });
const updateStorySchema = storySchema.partial().omit({ id: true });

export interface VideoStory {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  productId?: number;
  duration: number;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const TENANT_KEY = 'stories';

// GET /api/stories/:tenantId — Public: fetch active stories
router.get('/:tenantId', async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const stories = await getTenantData<VideoStory[]>(tenantId, TENANT_KEY);
    const activeStories = (stories || [])
      .filter(s => s.active)
      .sort((a, b) => a.order - b.order);
    res.json(activeStories);
  } catch (error) {
    next(error);
  }
});

// GET /api/stories/:tenantId/all — Admin: fetch all stories (including inactive)
router.get('/:tenantId/all', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const stories = await getTenantData<VideoStory[]>(tenantId, TENANT_KEY);
    res.json((stories || []).sort((a, b) => a.order - b.order));
  } catch (error) {
    next(error);
  }
});

// POST /api/stories/:tenantId — Admin: create a story
router.post('/:tenantId', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const body = createStorySchema.parse(req.body);
    const stories = await getTenantData<VideoStory[]>(tenantId, TENANT_KEY) || [];

    const now = new Date().toISOString();
    const newStory: VideoStory = {
      ...body,
      id: `story_${randomUUID()}`,
      order: body.order ?? stories.length,
      active: body.active ?? true,
      createdAt: now,
      updatedAt: now,
    };

    stories.push(newStory);
    await setTenantData(tenantId, TENANT_KEY, stories);

    res.status(201).json(newStory);
  } catch (error) {
    next(error);
  }
});

// PUT /api/stories/:tenantId/reorder — Admin: reorder stories (MUST be before :storyId route)
router.put('/:tenantId/reorder', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { orderedIds } = z.object({ orderedIds: z.array(z.string()) }).parse(req.body);
    const stories = await getTenantData<VideoStory[]>(tenantId, TENANT_KEY) || [];

    const reordered = orderedIds
      .map((id, index) => {
        const story = stories.find(s => s.id === id);
        return story ? { ...story, order: index, updatedAt: new Date().toISOString() } : null;
      })
      .filter(Boolean) as VideoStory[];

    // Append any stories not in orderedIds
    const remaining = stories
      .filter(s => !orderedIds.includes(s.id))
      .map((s, i) => ({ ...s, order: reordered.length + i, updatedAt: new Date().toISOString() }));

    await setTenantData(tenantId, TENANT_KEY, [...reordered, ...remaining]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// PUT /api/stories/:tenantId/:storyId — Admin: update a story
router.put('/:tenantId/:storyId', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { tenantId, storyId } = req.params;
    const body = updateStorySchema.parse(req.body);
    const stories = await getTenantData<VideoStory[]>(tenantId, TENANT_KEY) || [];

    const index = stories.findIndex(s => s.id === storyId);
    if (index === -1) {
      return res.status(404).json({ error: 'Story not found' });
    }

    stories[index] = {
      ...stories[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await setTenantData(tenantId, TENANT_KEY, stories);
    res.json(stories[index]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/stories/:tenantId/:storyId — Admin: delete a story
router.delete('/:tenantId/:storyId', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { tenantId, storyId } = req.params;
    const stories = await getTenantData<VideoStory[]>(tenantId, TENANT_KEY) || [];

    const filtered = stories.filter(s => s.id !== storyId);
    if (filtered.length === stories.length) {
      return res.status(404).json({ error: 'Story not found' });
    }

    await setTenantData(tenantId, TENANT_KEY, filtered);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { router as storiesRouter };
