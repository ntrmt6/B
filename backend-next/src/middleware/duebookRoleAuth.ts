import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { Device } from '../models/Device';
import { env } from '../config/env';

const hashToken = (raw: string) => crypto.createHash('sha256').update(raw).digest('hex');

/**
 * Auth middleware that accepts both:
 *  - Standard User JWT (owner / admin) → req.userRole = the user's role
 *  - Device JWT issued by pair/redeem (employee) → req.userRole = 'employee'
 *
 * Sets req.tenantId, req.userRole, req.userId. Rejects otherwise.
 */
export const duebookAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required', code: 'TOKEN_REQUIRED' });

    const secret = env.jwtSecret;
    if (!secret) return res.status(500).json({ error: 'Server config error' });
    const decoded = jwt.verify(token, secret) as {
      userId?: string;
      deviceId?: string;
      role?: string;
      tenantId?: string;
      email?: string;
    };

    // Device-issued token path
    if (decoded.deviceId || (typeof decoded.userId === 'string' && decoded.userId.startsWith('device:'))) {
      const deviceId = decoded.deviceId || (decoded.userId as string).replace(/^device:/, '');
      const doc = await Device.findById(deviceId);
      if (!doc) return res.status(401).json({ error: 'Device not found', code: 'DEVICE_NOT_FOUND' });
      if (doc.revokedAt) return res.status(403).json({ error: 'Device revoked', code: 'DEVICE_REVOKED' });
      if (!doc.tokenHash || doc.tokenHash === 'pending') {
        return res.status(401).json({ error: 'Device not activated', code: 'DEVICE_INACTIVE' });
      }
      req.tenantId = doc.tenantId;
      req.userRole = doc.role;
      req.userId = `device:${doc._id}`;
      doc.lastSeenAt = new Date();
      await doc.save().catch(() => {});
      return next();
    }

    // Standard user token path
    if (!decoded.userId) return res.status(401).json({ error: 'Invalid token', code: 'TOKEN_INVALID' });
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    if (!user.isActive) return res.status(403).json({ error: 'Account deactivated', code: 'ACCOUNT_DEACTIVATED' });

    req.user = user;
    req.userId = String(user._id);
    req.userRole = decoded.role || user.role;
    req.tenantId = decoded.tenantId || (user as any).tenantId;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    if (err instanceof jwt.JsonWebTokenError) return res.status(401).json({ error: 'Invalid token', code: 'TOKEN_INVALID' });
    console.error('[duebookAuth] error:', err);
    return res.status(500).json({ error: 'Auth error' });
  }
};

export const verifyDeviceTokenHash = (rawToken: string, tokenHash: string) =>
  hashToken(rawToken) === tokenHash;
