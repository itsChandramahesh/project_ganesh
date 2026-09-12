import { Router } from 'express';
import multer from 'multer';
import {
  getApprovedMandapams,
  getFeaturedMandapams,
  getMandapamById,
  createMandapamSubmission,
} from '../controllers/mandapams.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();

router.get('/featured', getFeaturedMandapams);
router.get('/', getApprovedMandapams);
router.get('/:id', getMandapamById);
router.post('/', upload.single('imageFile'), createMandapamSubmission);

export default router;
