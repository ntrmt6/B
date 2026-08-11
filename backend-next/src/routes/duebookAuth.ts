import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { DueBookSettings } from '../models/DueBookSettings';
import { env } from '../config/env';
import type { JWTPayload } from '../middleware/auth';

export const duebookAuthRouter = Router();

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  shopName: z.string().optional(),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(64),
  newPassword: z.string().min(6),
});

const signToken = (user: { _id: any; email: string; role: string; tenantId?: string }) => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '30d' as any });
};

/**
 * POST /api/duebook/auth/signup
 * Self-serve signup for DueBook. Creates a user, self-assigns tenantId
 * to the user's own _id so their data is isolated to their own shop.
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
    const user = new User({
      name: data.name,
      email,
      password: hashed,
      phone: data.phone,
      role: 'tenant_admin',
      isActive: true,
      provider: 'local',
    });
    await user.save();

    // Self-tenant: user's data is scoped by their own _id
    user.tenantId = user._id.toString();
    await user.save();

    // Optionally seed shopName into DueBookSettings
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
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        tenantId: user.tenantId,
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
 * Generates a short-lived reset code, stores its hash on the user,
 * and returns the code in the response (MVP — no email/SMS infra).
 * Frontend surfaces it to the user on the same device.
 */
duebookAuthRouter.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Do not leak existence
      return res.json({ ok: true, message: 'If that email is registered, a reset code has been generated.' });
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    user.resetTokenHash = hash;
    user.resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    console.log(`[duebook/forgot-password] Reset code for ${email}: ${code}`);

    res.json({
      ok: true,
      message: 'Reset code generated. Use it within 30 minutes.',
      // MVP: return the code so the same-device user can use it immediately.
      // TODO: when an email/SMS/WhatsApp provider is configured, remove this
      // and send the code out-of-band instead.
      code,
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
 * Verifies the reset code and updates the password.
 */
duebookAuthRouter.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code, newPassword } = resetSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+resetTokenHash +resetTokenExpiresAt +password');
    if (!user || !user.resetTokenHash || !user.resetTokenExpiresAt) {
      return res.status(400).json({ error: 'Invalid or expired code', code: 'RESET_INVALID' });
    }
    if (user.resetTokenExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: 'Reset code has expired', code: 'RESET_EXPIRED' });
    }
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    if (hash !== user.resetTokenHash) {
      return res.status(400).json({ error: 'Invalid or expired code', code: 'RESET_INVALID' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetTokenHash = undefined;
    user.resetTokenExpiresAt = undefined;
    await user.save();

    const token = signToken(user);
    res.json({
      ok: true,
      message: 'Password updated',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors, code: 'VALIDATION_ERROR' });
    }
    next(error);
  }
});

export default duebookAuthRouter;
