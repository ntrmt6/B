import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { env } from '../config/env';
import { authenticateToken } from '../middleware/auth';
import { User } from '../models/User';
import { SocialPost } from '../models/SocialPost';
import { SocialComment } from '../models/SocialComment';
import { SocialLike } from '../models/SocialLike';
import { SocialFollow } from '../models/SocialFollow';
import { SocialConversation, SocialMessage } from '../models/SocialMessage';

export const duebookSocialRouter = Router();

// ── Media upload (must be before auth for multer parsing; auth applied per route) ──
const socialUploadDir = path.join(env.uploadDir || path.join(process.cwd(), 'uploads'), 'social');
fs.mkdirSync(socialUploadDir, { recursive: true });
const socialStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, socialUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase().replace(/[^.a-z0-9]/g, '');
    cb(null, `${Date.now()}-${randomUUID()}${ext || ''}`);
  },
});
const socialUpload = multer({
  storage: socialStorage,
  limits: { fileSize: 60 * 1024 * 1024 }, // 60MB (video-friendly)
  fileFilter: (_req, file, cb) => {
    const ok = /^(image|video)\//i.test(file.mimetype);
    if (!ok) return cb(new Error(`Unsupported type ${file.mimetype}`));
    cb(null, true);
  },
});

duebookSocialRouter.post('/upload', authenticateToken, socialUpload.single('file'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  // Return a same-origin relative URL. The DueBook app proxies /uploads/* to the backend.
  const url = `/uploads/social/${req.file.filename}`;
  res.json({ url, mimeType: req.file.mimetype, size: req.file.size });
});

duebookSocialRouter.use(authenticateToken);

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);
const isValidId = (id: string) => mongoose.isValidObjectId(id);

// Strip absolute-URL prefix from any stored /uploads/social path so the client
// can resolve it same-origin (the DueBook app proxies /uploads/* to backend).
const normalizeMedia = (url?: string) => {
  if (!url || typeof url !== 'string') return url;
  const idx = url.indexOf('/uploads/');
  return idx > 0 ? url.slice(idx) : url;
};
const normalizePost = <T extends { images?: string[]; videoUrl?: string; thumbnailUrl?: string }>(p: T): T => ({
  ...p,
  images: p.images ? p.images.map(s => normalizeMedia(s) || s) : p.images,
  videoUrl: normalizeMedia(p.videoUrl),
  thumbnailUrl: normalizeMedia(p.thumbnailUrl),
});

const projectAuthor = (u: any) => u ? ({
  _id: u._id,
  name: u.name,
  image: u.image || '',
  bio: u.bio || '',
  followerCount: u.followerCount || 0,
  followingCount: u.followingCount || 0,
  postCount: u.postCount || 0,
}) : null;

// ── Feed ─────────────────────────────────────────────────────────────
duebookSocialRouter.get('/feed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const before = typeof req.query.before === 'string' ? new Date(req.query.before) : null;
    const kind = req.query.kind === 'short' ? 'short' : 'post';
    const filter: any = { kind };
    if (before && !isNaN(before.getTime())) filter.createdAt = { $lt: before };
    const posts = await SocialPost.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    const authorIds = [...new Set(posts.map(p => String(p.authorId)))];
    const authors = await User.find({ _id: { $in: authorIds } }).select('name image bio followerCount followingCount postCount').lean();
    const authorMap = new Map(authors.map(a => [String(a._id), a]));
    const likedRows = req.userId ? await SocialLike.find({
      userId: toObjectId(req.userId),
      targetType: 'post',
      targetId: { $in: posts.map(p => p._id) },
    }).select('targetId').lean() : [];
    const likedSet = new Set(likedRows.map(r => String(r.targetId)));
    res.json(posts.map(p => ({
      ...normalizePost(p),
      author: projectAuthor(authorMap.get(String(p.authorId))),
      liked: likedSet.has(String(p._id)),
    })));
  } catch (e) { next(e); }
});

// ── Create Post ──────────────────────────────────────────────────────
const createPostSchema = z.object({
  kind: z.enum(['post', 'short']).default('post'),
  text: z.string().max(5000).optional(),
  images: z.array(z.string()).max(10).optional(),
  videoUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

duebookSocialRouter.post('/posts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createPostSchema.parse(req.body);
    if (!data.text && !(data.images && data.images.length) && !data.videoUrl) {
      return res.status(400).json({ error: 'Post needs text, images or a video' });
    }
    if (data.kind === 'short' && !data.videoUrl) {
      return res.status(400).json({ error: 'Shorts require a videoUrl' });
    }
    const post = await SocialPost.create({
      authorId: toObjectId(req.userId!),
      kind: data.kind,
      text: data.text,
      images: data.images || [],
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl,
    });
    await User.updateOne({ _id: toObjectId(req.userId!) }, { $inc: { postCount: 1 } });
    const author = await User.findById(req.userId).select('name image bio followerCount followingCount postCount').lean();
    res.status(201).json({ ...post.toObject(), author: projectAuthor(author), liked: false });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    next(e);
  }
});

duebookSocialRouter.delete('/posts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const post = await SocialPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    if (String(post.authorId) !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    await Promise.all([
      SocialPost.deleteOne({ _id: post._id }),
      SocialComment.deleteMany({ postId: post._id }),
      SocialLike.deleteMany({ targetType: 'post', targetId: post._id }),
      User.updateOne({ _id: post.authorId }, { $inc: { postCount: -1 } }),
    ]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Single Post ──────────────────────────────────────────────────────
duebookSocialRouter.get('/posts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const post = await SocialPost.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ error: 'Not found' });
    const author = await User.findById(post.authorId).select('name image bio followerCount followingCount postCount').lean();
    const liked = req.userId ? !!(await SocialLike.exists({ userId: toObjectId(req.userId), targetType: 'post', targetId: post._id })) : false;
    res.json({ ...normalizePost(post), author: projectAuthor(author), liked });
  } catch (e) { next(e); }
});

// ── Like/Unlike ──────────────────────────────────────────────────────
duebookSocialRouter.post('/posts/:id/like', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const postId = toObjectId(req.params.id);
    try {
      await SocialLike.create({ userId: toObjectId(req.userId!), targetType: 'post', targetId: postId });
      const updated = await SocialPost.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } }, { new: true });
      return res.json({ liked: true, likeCount: updated?.likeCount || 0 });
    } catch (err: any) {
      if (err?.code === 11000) {
        await SocialLike.deleteOne({ userId: toObjectId(req.userId!), targetType: 'post', targetId: postId });
        const updated = await SocialPost.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } }, { new: true });
        return res.json({ liked: false, likeCount: Math.max(0, updated?.likeCount || 0) });
      }
      throw err;
    }
  } catch (e) { next(e); }
});

// ── Share (bump counter) ────────────────────────────────────────────
duebookSocialRouter.post('/posts/:id/share', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const updated = await SocialPost.findByIdAndUpdate(req.params.id, { $inc: { shareCount: 1 } }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ shareCount: updated.shareCount });
  } catch (e) { next(e); }
});

// ── Comments / Replies ──────────────────────────────────────────────
const commentSchema = z.object({
  text: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

duebookSocialRouter.get('/posts/:id/comments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const comments = await SocialComment.find({ postId: toObjectId(req.params.id) })
      .sort({ createdAt: 1 }).limit(500).lean();
    const authorIds = [...new Set(comments.map(c => String(c.authorId)))];
    const authors = await User.find({ _id: { $in: authorIds } }).select('name image').lean();
    const map = new Map(authors.map(a => [String(a._id), a]));
    res.json(comments.map(c => ({ ...c, author: projectAuthor(map.get(String(c.authorId))) })));
  } catch (e) { next(e); }
});

duebookSocialRouter.post('/posts/:id/comments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const data = commentSchema.parse(req.body);
    const postId = toObjectId(req.params.id);
    const post = await SocialPost.findById(postId);
    if (!post) return res.status(404).json({ error: 'Not found' });

    let parentId: mongoose.Types.ObjectId | undefined;
    if (data.parentId) {
      if (!isValidId(data.parentId)) return res.status(400).json({ error: 'Invalid parent id' });
      parentId = toObjectId(data.parentId);
      const parent = await SocialComment.findById(parentId);
      if (!parent || String(parent.postId) !== String(postId)) return res.status(400).json({ error: 'Invalid parent' });
    }

    const comment = await SocialComment.create({
      postId,
      authorId: toObjectId(req.userId!),
      parentId,
      text: data.text.trim(),
    });
    await SocialPost.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });
    if (parentId) await SocialComment.updateOne({ _id: parentId }, { $inc: { replyCount: 1 } });
    const author = await User.findById(req.userId).select('name image').lean();
    res.status(201).json({ ...comment.toObject(), author: projectAuthor(author) });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    next(e);
  }
});

duebookSocialRouter.delete('/comments/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const comment = await SocialComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Not found' });
    if (String(comment.authorId) !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    await SocialComment.deleteOne({ _id: comment._id });
    await SocialPost.updateOne({ _id: comment.postId }, { $inc: { commentCount: -1 } });
    if (comment.parentId) await SocialComment.updateOne({ _id: comment.parentId }, { $inc: { replyCount: -1 } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Profile ─────────────────────────────────────────────────────────
duebookSocialRouter.get('/profile/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId).select('name email image bio coverImage phone address followerCount followingCount postCount').lean();
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ ...projectAuthor(user), email: user.email, phone: user.phone, address: user.address, coverImage: user.coverImage || '' });
  } catch (e) { next(e); }
});

const profileUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  bio: z.string().max(500).optional(),
  image: z.string().optional(),
  coverImage: z.string().optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(200).optional(),
});

duebookSocialRouter.put('/profile/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = profileUpdateSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(req.userId, { $set: data }, { new: true })
      .select('name email image bio coverImage phone address followerCount followingCount postCount');
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ ...projectAuthor(user), email: user.email, phone: user.phone, address: user.address, coverImage: user.coverImage || '' });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    next(e);
  }
});

duebookSocialRouter.get('/profile/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const user = await User.findById(req.params.id).select('name image bio coverImage followerCount followingCount postCount').lean();
    if (!user) return res.status(404).json({ error: 'Not found' });
    const isFollowing = req.userId ? !!(await SocialFollow.exists({ followerId: toObjectId(req.userId), followeeId: user._id })) : false;
    res.json({ ...projectAuthor(user), coverImage: user.coverImage || '', isFollowing });
  } catch (e) { next(e); }
});

duebookSocialRouter.get('/profile/:id/posts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const posts = await SocialPost.find({ authorId: toObjectId(req.params.id) })
      .sort({ createdAt: -1 }).limit(limit).lean();
    const author = await User.findById(req.params.id).select('name image bio followerCount followingCount postCount').lean();
    const likedRows = req.userId ? await SocialLike.find({
      userId: toObjectId(req.userId), targetType: 'post', targetId: { $in: posts.map(p => p._id) },
    }).select('targetId').lean() : [];
    const likedSet = new Set(likedRows.map(r => String(r.targetId)));
    res.json(posts.map(p => ({ ...normalizePost(p), author: projectAuthor(author), liked: likedSet.has(String(p._id)) })));
  } catch (e) { next(e); }
});

// ── Follow / Unfollow ───────────────────────────────────────────────
duebookSocialRouter.post('/profile/:id/follow', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    if (req.params.id === req.userId) return res.status(400).json({ error: "Can't follow yourself" });
    const followeeId = toObjectId(req.params.id);
    const followerId = toObjectId(req.userId!);
    try {
      await SocialFollow.create({ followerId, followeeId });
      await User.updateOne({ _id: followerId }, { $inc: { followingCount: 1 } });
      await User.updateOne({ _id: followeeId }, { $inc: { followerCount: 1 } });
      return res.json({ following: true });
    } catch (err: any) {
      if (err?.code === 11000) {
        await SocialFollow.deleteOne({ followerId, followeeId });
        await User.updateOne({ _id: followerId }, { $inc: { followingCount: -1 } });
        await User.updateOne({ _id: followeeId }, { $inc: { followerCount: -1 } });
        return res.json({ following: false });
      }
      throw err;
    }
  } catch (e) { next(e); }
});

// ── Discover people ─────────────────────────────────────────────────
duebookSocialRouter.get('/people', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const filter: any = { isActive: true, _id: { $ne: toObjectId(req.userId!) } };
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { email: rx }];
    }
    const users = await User.find(filter)
      .select('name image bio followerCount followingCount postCount')
      .sort({ followerCount: -1 })
      .limit(30).lean();
    const following = await SocialFollow.find({ followerId: toObjectId(req.userId!), followeeId: { $in: users.map(u => u._id) } }).select('followeeId').lean();
    const followingSet = new Set(following.map(f => String(f.followeeId)));
    res.json(users.map(u => ({ ...projectAuthor(u), isFollowing: followingSet.has(String(u._id)) })));
  } catch (e) { next(e); }
});

// ── Messages ────────────────────────────────────────────────────────
duebookSocialRouter.get('/conversations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const convos = await SocialConversation.find({ participants: toObjectId(req.userId!) })
      .sort({ lastMessageAt: -1, updatedAt: -1 }).limit(100).lean();
    const otherIds = [...new Set(convos.flatMap(c => c.participants.map(p => String(p)).filter(p => p !== req.userId)))];
    const users = await User.find({ _id: { $in: otherIds } }).select('name image').lean();
    const uMap = new Map(users.map(u => [String(u._id), u]));
    res.json(convos.map(c => {
      const otherId = c.participants.map(p => String(p)).find(p => p !== req.userId);
      return {
        _id: c._id,
        other: otherId ? projectAuthor(uMap.get(otherId)) : null,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        lastFromMe: c.lastSenderId ? String(c.lastSenderId) === req.userId : false,
        updatedAt: c.updatedAt,
      };
    }));
  } catch (e) { next(e); }
});

duebookSocialRouter.post('/conversations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const otherId = String(req.body?.userId || '');
    if (!isValidId(otherId)) return res.status(400).json({ error: 'Invalid userId' });
    if (otherId === req.userId) return res.status(400).json({ error: "Can't chat with yourself" });
    const meObj = toObjectId(req.userId!);
    const otherObj = toObjectId(otherId);
    let convo = await SocialConversation.findOne({ participants: { $all: [meObj, otherObj], $size: 2 } });
    if (!convo) convo = await SocialConversation.create({ participants: [meObj, otherObj] });
    const other = await User.findById(otherObj).select('name image').lean();
    res.status(201).json({
      _id: convo._id,
      other: projectAuthor(other),
      lastMessage: convo.lastMessage,
      lastMessageAt: convo.lastMessageAt,
      lastFromMe: false,
      updatedAt: convo.updatedAt,
    });
  } catch (e) { next(e); }
});

duebookSocialRouter.get('/conversations/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const convo = await SocialConversation.findById(req.params.id);
    if (!convo || !convo.participants.some(p => String(p) === req.userId)) {
      return res.status(404).json({ error: 'Not found' });
    }
    const msgs = await SocialMessage.find({ conversationId: convo._id }).sort({ createdAt: 1 }).limit(300).lean();
    res.json(msgs.map(m => ({ ...m, imageUrl: normalizeMedia(m.imageUrl), fromMe: String(m.senderId) === req.userId })));
  } catch (e) { next(e); }
});

duebookSocialRouter.post('/conversations/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const text = typeof req.body?.text === 'string' ? req.body.text.trim().slice(0, 5000) : '';
    const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl : undefined;
    if (!text && !imageUrl) return res.status(400).json({ error: 'Message required' });
    const convo = await SocialConversation.findById(req.params.id);
    if (!convo || !convo.participants.some(p => String(p) === req.userId)) {
      return res.status(404).json({ error: 'Not found' });
    }
    const msg = await SocialMessage.create({
      conversationId: convo._id,
      senderId: toObjectId(req.userId!),
      text: text || undefined,
      imageUrl,
      readBy: [toObjectId(req.userId!)],
    });
    convo.lastMessage = text || '[image]';
    convo.lastMessageAt = new Date();
    convo.lastSenderId = toObjectId(req.userId!);
    await convo.save();
    res.status(201).json({ ...msg.toObject(), fromMe: true });
  } catch (e) { next(e); }
});

// ── Invitations ─────────────────────────────────────────────────────
duebookSocialRouter.post('/invite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const to = typeof req.body?.to === 'string' ? req.body.to.trim() : '';
    if (!to) return res.status(400).json({ error: 'Recipient required' });
    const me = await User.findById(req.userId).select('name');
    const originHeader = (req.headers['origin'] as string) || '';
    const referer = (req.headers['referer'] as string) || '';
    let base = '';
    if (originHeader) base = originHeader.replace(/\/$/, '');
    else if (referer) { try { const u = new URL(referer); base = `${u.protocol}//${u.host}`; } catch {} }
    if (!base) base = 'https://duebook.shopbdit.com';
    const inviteUrl = `${base}/login?ref=${req.userId}`;
    res.json({
      ok: true,
      inviteUrl,
      message: `${me?.name || 'Your friend'} invited you to DueBook — the free Bengali baki khata + social app. Sign up here: ${inviteUrl}`,
    });
  } catch (e) { next(e); }
});

export default duebookSocialRouter;
