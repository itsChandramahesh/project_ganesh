import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAdminAuth } from '../middleware/adminAuth.js';
import { requireAdminCsrfHeader } from '../middleware/csrf.js';
import {
  adminLogin,
  adminLogout,
  getAdminProfile,
  getAdminMandapams,
  getAdminMandapamById,
  updateMandapam,
  approveMandapam,
  rejectMandapam,
  setVerifiedStatus,
  setFeaturedStatus,
  deleteMandapam,
} from '../controllers/admin.controller.js';

const router = Router();

// Ensure all admin responses are never cached by intermediaries or browsers
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store, private');
  next();
});

// Rate limiter for admin login: 5 failed attempts per 15 min per IP
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many failed login attempts. Please try again in 15 minutes.',
  },
});

// Public authentication endpoint with brute-force protection
router.post('/login', adminLoginLimiter, adminLogin);

// Protected admin endpoints (require valid admin session)
router.use(requireAdminAuth);

// Enforce CSRF protection header on all state-changing admin operations (POST, PATCH, DELETE)
router.use(requireAdminCsrfHeader);

router.post('/logout', adminLogout);
router.get('/me', getAdminProfile);

router.get('/mandapams', getAdminMandapams);
router.get('/mandapams/:id', getAdminMandapamById);
router.patch('/mandapams/:id', updateMandapam);
router.post('/mandapams/:id/approve', approveMandapam);
router.post('/mandapams/:id/reject', rejectMandapam);
router.post('/mandapams/:id/verify', setVerifiedStatus);
router.post('/mandapams/:id/feature', setFeaturedStatus);
router.delete('/mandapams/:id', deleteMandapam);

export default router;
