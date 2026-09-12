import { Request, Response, NextFunction } from 'express';

/**
 * CSRF Protection Middleware for Administrative Mutations
 *
 * Enforces the presence of custom header 'X-Admin-Action: 1' on state-changing requests.
 * Standard browsers cannot send custom headers cross-origin without passing a CORS preflight.
 */
export function requireAdminCsrfHeader(req: Request, res: Response, next: NextFunction): void {
  // Allow safe/idempotent HTTP methods (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const headerVal = req.header('x-admin-action');

  if (headerVal !== '1') {
    res.status(403).json({
      success: false,
      error: 'Security error: Missing or invalid X-Admin-Action header on state-changing admin request.',
    });
    return;
  }

  next();
}
