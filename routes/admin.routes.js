import express from 'express';
import {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getSubmissions,
  updateSubmissionStatus,
  createPackage,
  getPackages,
  deletePackage,
} from '../controller/admin.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// Admin Protection applied to all routes in this router
router.use(protect, requireAdmin);

// Dashboard
router.get('/dashboard-stats', getDashboardStats);

// User Management
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);

// Task Management
router.post('/tasks', upload.single('image'), createTask);
router.get('/tasks', getTasks);
router.put('/tasks/:id', upload.single('image'), updateTask);
router.delete('/tasks/:id', deleteTask);

// Task Submissions Review & Approval
router.get('/submissions', getSubmissions);
router.patch('/submissions/:id', updateSubmissionStatus);

// Package Management (Upload / Create, List, Delete)
router.post('/packages', createPackage);
router.get('/packages', getPackages);
router.delete('/packages/:id', deletePackage);

export default router;

