import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config.js';

export interface AuthUser {
  userId: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), env.JWT_SECRET) as AuthUser;
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}