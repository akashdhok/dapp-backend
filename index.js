import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { connectDB } from './config/db.js';
import { seedInitialData } from './config/seed.js';

import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './routes/user.routes.js';
import uploadRoutes from './routes/upload.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded static files
app.use('/uploads', express.static(uploadsDir));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', message: 'DApp Backend API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await seedInitialData();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT} (http://localhost:${PORT})`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
