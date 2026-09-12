import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getAdminJwtSecret } from '../config/envValidation.js';

export interface AdminPayload {
  email: string;
  role: 'admin';
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  // 1. Extract token from HTTP-only cookie or Authorization header fallback
  const token =
    req.cookies?.admin_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in to access admin resources.',
    });
    return;
  }

  let jwtSecret: string;
  try {
    jwtSecret = getAdminJwtSecret();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Authentication configuration error.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AdminPayload;
    if (!decoded || decoded.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden. Admin privileges required.',
      });
      return;
    }

    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired session. Please log in again.',
    });
  }
}
