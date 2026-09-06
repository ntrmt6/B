import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { DueBookSettings } from '../models/DueBookSettings';
import { env } from '../config/env';
import type { JWTPayload } from '../middleware/auth';
import { authenticateToken } from '../middleware/auth';

export const duebookAuthRouter = Router();

// ── Schemas ──────────────────────────────────────────────────────────────
const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  shopName: z.string().optional(),
  securityQuestion: z.string().min(4).max(160),
  securityAnswer: z.string().min(2).max(200),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  email: z.string().email(),
  securityAnswer: z.string().min(1).max(200),
  newPassword: z.string().min(6),
});

const setRecoverySchema = z.object({
  currentPassword: z.string().min(1),
  securityQuestion: z.string().min(4).max(160),
  securityAnswer: z.string().min(2).max(200),
});

const googleSchema = z.object({
  credential: z.string().min(20),
  shopName: z.string().optional(),
});

// ── Helpers ──────────────────────────────────────────────────────────────
const signToken = (user: { _id: any; email: string; role: string; tenantId?: string }) => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '30d' as any });
};

const normalizeAnswer = (raw: string) => raw.trim().toLowerCase().replace(/\s+/g, ' ');

// Simple in-memory rate limit: 5 attempts per 15 minutes per email.
type Bucket = { count: number; resetAt: number };
const attempts = new Map<string, Bucket>();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 5;
const rateLimit = (key: string): { ok: boolean; retryAfter?: number } => {
  const now = Date.now();
  const b = attempts.get(key);
  if (!b || b.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { ok: true };
  }
  if (b.count >= RATE_MAX) return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  b.count += 1;
  return { ok: true };
};
const rateReset = (key: string) => attempts.delete(key);

// ── Routes ───────────────────────────────────────────────────────────────

/**
 * POST /api/duebook/auth/signup
 * Creates a user with self-tenant. Requires a security question + answer
 * so password recovery has a real verification factor.
 */
duebookAuthRouter.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = signupSchema.parse(req.body);
    const email = data.email.toLowerCase();

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'This email is already registered', code: 'EMAIL_EXISTS' });
    }

    const hashed = await bcrypt.hash(data.password, 10);
    const answerHash = await bcrypt.hash(normalizeAnswer(data.securityAnswer), 10);

    const user = new User({
      name: data.name,
      email,
      password: hashed,
      phone: data.phone,
      role: 'tenant_admin',
      isActive: true,
      provider: 'local',
      securityQuestion: data.securityQuestion.trim(),
      securityAnswerHash: answerHash,
    });
    await user.save();

    user.tenantId = user._id.toString();
    await user.save();

    if (data.shopName?.trim()) {
      try {
        await DueBookSettings.findOneAndUpdate(
          { tenantId: user.tenantId },
          { $set: { shopName: data.shopName.trim().slice(0, 120) }, $setOnInsert: { tenantId: user.tenantId } },
          { upsert: true, new: true },
        );
      } catch (e) {
        console.warn('[duebook/signup] failed to seed shopName:', e);
      }
    }

    const token = signToken(user);
    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: user._id, name: user.name, email: user.email, phone: user.phone,
        role: user.role, tenantId: user.tenantId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors, code: 'VALIDATION_ERROR' });
    }
    next(error);
  }
});

/**
 * POST /api/duebook/auth/google
 * One-tap / Google Sign-In. Verifies a Google ID token (credential from
 * Google Identity Services), then either logs in an existing account or
 * creates a new self-tenant DueBook account.
 */
duebookAuthRouter.post('/google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential, shopName } = googleSchema.parse(req.body);

    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!verifyRes.ok) {
      return res.status(401).json({ error: 'Invalid Google token', code: 'INVALID_TOKEN' });
    }
    const info = await verifyRes.json() as {
      email?: string; email_verified?: string | boolean; name?: string;
      picture?: string; sub?: string; aud?: string;
    };
    if (!info.email || !info.sub) {
      return res.status(401).json({ error: 'Malformed Google token', code: 'INVALID_TOKEN' });
    }
    if (info.email_verified !== true && info.email_verified !== 'true') {
      return res.status(401).json({ error: 'Google email not verified', code: 'EMAIL_UNVERIFIED' });
    }
    if (env.googleClientId && info.aud !== env.googleClientId) {
      return res.status(401).json({ error: 'Token audience mismatch', code: 'AUD_MISMATCH' });
    }

    const email = info.email.toLowerCase();
    let user = await User.findOne({ email });

    if (!user) {
      const randomPw = await bcrypt.hash(Math.random().toString(36).slice(2) + Date.now(), 10);
      user = new User({
        name: info.name || email.split('@')[0],
        email,
        password: randomPw,
        image: info.picture,
        role: 'tenant_admin',
        isActive: true,
        provider: 'google',
        providerId: info.sub,
        lastLogin: new Date(),
      });
      await user.save();
      user.tenantId = user._id.toString();
      await user.save();

      if (shopName?.trim()) {
        try {
          await DueBookSettings.findOneAndUpdate(
            { tenantId: user.tenantId },
            { $set: { shopName: shopName.trim().slice(0, 120) }, $setOnInsert: { tenantId: user.tenantId } },
            { upsert: true, new: true },
          );
        } catch (e) {
          console.warn('[duebook/google] failed to seed shopName:', e);
        }
      }
    } else {
      if (!user.tenantId) user.tenantId = user._id.toString();
      if (info.picture && !user.image) user.image = info.picture;
      if (user.provider === 'local' && !user.providerId) {
        // link the Google identity without breaking the local password
        user.providerId = info.sub;
      }
      user.lastLogin = new Date();
      await user.save();
    }

    const token = signToken(user);
    res.json({
      message: 'Google sign-in successful',
      token,
      user: {
        id: user._id, _id: user._id, name: user.name, email: user.email,
        phone: user.phone, role: user.role, tenantId: user.tenantId,
        image: user.image,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors, code: 'VALIDATION_ERROR' });
    }
    next(error);
  }
});

/**
 * POST /api/duebook/auth/forgot-password
 * Returns the account's security question so the user can prove identity.
 * Does NOT return a code or leak whether the email exists (except via the
 * question being present — if a valid email has no question configured we
 * still return a generic message so an attacker can't distinguish).
 */
duebookAuthRouter.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotSchema.parse(req.body);
    const key = 'fp:' + email.toLowerCase();
    const rl = rateLimit(key);
    if (!rl.ok) {
      return res.status(429).json({ error: `Too many attempts. Try again in ${rl.retryAfter}s.`, code: 'RATE_LIMITED' });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+securityAnswerHash securityQuestion');

    if (!user || !user.securityQuestion || !user.securityAnswerHash) {
      // Do not leak. Also do not offer a path.
      return res.json({
        ok: false,
        message: 'No recovery is configured for this account. Please sign in and set a security question in Settings, or contact support.',
      });
    }

    return res.json({
      ok: true,
      question: user.securityQuestion,
      message: 'Answer the security question to reset your password.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors, code: 'VALIDATION_ERROR' });
    }
    next(error);
  }
});

/**
 * POST /api/duebook/auth/reset-password
 * Verifies the security answer and updates the password.
 */
duebookAuthRouter.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, securityAnswer, newPassword } = resetSchema.parse(req.body);
    const key = 'rp:' + email.toLowerCase();
    const rl = rateLimit(key);
    if (!rl.ok) {
      return res.status(429).json({ error: `Too many attempts. Try again in ${rl.retryAfter}s.`, code: 'RATE_LIMITED' });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+securityAnswerHash +password securityQuestion');
    if (!user || !user.securityAnswerHash) {
      return res.status(400).json({ error: 'Invalid answer', code: 'RESET_INVALID' });
    }

    const ok = await bcrypt.compare(normalizeAnswer(securityAnswer), user.securityAnswerHash);
    if (!ok) {
      return res.status(400).json({ error: 'Invalid answer', code: 'RESET_INVALID' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    rateReset(key);

    const token = signToken(user);
    res.json({
      ok: true,
      message: 'Password updated',
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, tenantId: user.tenantId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors, code: 'VALIDATION_ERROR' });
    }
    next(error);
  }
});

/**
 * GET /api/duebook/auth/recovery-status
 * Returns whether the signed-in user has recovery configured.
 */
duebookAuthRouter.get('/recovery-status', authenticateToken, async (req: Request, res: Response) => {
  const user = await User.findById(req.userId).select('securityQuestion');
  res.json({
    hasRecovery: !!user?.securityQuestion,
    question: user?.securityQuestion || '',
  });
});

/**
 * PUT /api/duebook/auth/security-question
 * Signed-in user sets or changes their security question. Requires current
 * password so a stolen session token alone can't rewrite recovery.
 */
duebookAuthRouter.put('/security-question', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = setRecoverySchema.parse(req.body);
    const user = await User.findById(req.userId).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await bcrypt.compare(data.currentPassword, user.password);
    if (!ok) return res.status(400).json({ error: 'Current password is incorrect', code: 'INVALID_PASSWORD' });

    user.securityQuestion = data.securityQuestion.trim();
    user.securityAnswerHash = await bcrypt.hash(normalizeAnswer(data.securityAnswer), 10);
    await user.save();
    res.json({ ok: true, message: 'Recovery updated' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors, code: 'VALIDATION_ERROR' });
    }
    next(error);
  }
});

export default duebookAuthRouter;
