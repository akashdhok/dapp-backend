import express from 'express';
import {
  getUserDashboard,
  getAvailablePackages,
  purchasePackage,
  getAvailableTasks,
  submitTaskProof,
  getMySubmissions,
  getReferrals,
} from '../controller/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getUserDashboard);
router.get('/packages', getAvailablePackages);
router.post('/purchase-package/:packageId', purchasePackage);
router.get('/tasks', getAvailableTasks);
router.post('/tasks/:taskId/submit', upload.single('screenshot'), submitTaskProof);
router.get('/submissions', getMySubmissions);
router.get('/referrals', getReferrals);

export default router;

