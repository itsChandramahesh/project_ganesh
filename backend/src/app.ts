import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import mandapamsRouter from './routes/mandapams.routes.js';
import adminRouter from './routes/admin.routes.js';

export function createApp(): Express {
  const app = express();

  // Trust first upstream reverse proxy (Render, Railway, Fly.io, Cloudflare)
  // Ensures req.ip correctly identifies client IP for rate limiters without allowing client spoofing
  app.set('trust proxy', 1);

  // Security headers via Helmet (allow cross-origin for local asset images)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // HTTP response compression (skip responses < 1KB or already compressed image media)
  app.use(
    compression({
      threshold: 1024,
    }),
  );

  // Hardened CORS: allow development origin and any configured in CORS_ORIGIN
  const allowedOrigins = new Set<string>(['http://localhost:5173']);
  if (process.env.CORS_ORIGIN) {
    process.env.CORS_ORIGIN.split(',')
      .map((o) => o.trim())
      .filter(Boolean)
      .forEach((o) => allowedOrigins.add(o));
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, server-to-server, Postman)
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowedOrigins.has(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS error: Origin '${origin}' is not allowed.`));
        }
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Static directory for uploaded mandapam images
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/api/uploads', express.static(uploadsDir));
  app.use('/uploads', express.static(uploadsDir));

  // Health check (explicitly not cached)
  app.get('/api/health', (_req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json({
      status: 'ok',
      service: 'ganesh-darshan-backend',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/mandapams', mandapamsRouter);
  app.use('/api/admin', adminRouter);

  // 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
  });

  // Global Error Handler with production error message masking
  app.use((err: Error & { status?: number; statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[App Error]:', err);
    const isProduction = process.env.NODE_ENV === 'production';
    const status = err.status || err.statusCode || 500;

    if (status === 413) {
      res.status(413).json({ success: false, error: 'Request payload too large. Maximum size is 100kb.' });
      return;
    }

    res.status(status).json({
      success: false,
      error: isProduction ? (status === 500 ? 'Internal server error' : err.message) : (err.message || 'Internal server error'),
    });
  });

  return app;
}
