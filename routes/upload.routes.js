import express from 'express';
import { upload } from '../middleware/upload.middleware.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({
    success: true,
    fileUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

export default router;

