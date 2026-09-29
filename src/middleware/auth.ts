import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { adminAuth } from '../lib/firebase-admin.ts';

export interface AuthUser {
  uid: string;
  email: string;
  name?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'pocketsmart-ai-hmac-secret-key-2026';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
}

export function createSessionToken(payload: AuthUser): string {
  const data = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  return `ps_sess.${data}.${signature}`;
}

export function verifySessionToken(token: string): AuthUser | null {
  if (!token.startsWith('ps_sess.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, data, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (parsed.exp && Date.now() > parsed.exp) return null;
    return {
      uid: parsed.uid,
      email: parsed.email,
      name: parsed.name,
    };
  } catch {
    return null;
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Please sign in to access this resource.' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Check custom session token first (Email/Password & Demo User)
  const sessionUser = verifySessionToken(token);
  if (sessionUser) {
    req.user = sessionUser;
    return next();
  }

  // Otherwise verify Firebase ID token (Google Sign-In)
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || 'user@pocketsmart.ai',
      name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Smart Planner',
    };
    return next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ error: 'Your session has expired or is invalid. Please sign in again.' });
  }
};
