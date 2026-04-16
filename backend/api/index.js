// Vercel Serverless API Entry Point
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Import routes
import aiRoutes from '../src/routes/ai.js';
import authRoutes from '../src/routes/auth.js';
import applicationRoutes from '../src/routes/applications.js';
import uploadRoutes from '../src/routes/upload.js';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin (only if not already initialized)
let db;
if (getApps().length === 0) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString()
  );
  
  initializeApp({
    credential: cert(serviceAccount)
  });
}
db = getFirestore();

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: '请求过于频繁，请稍后再试' }
});
app.use(limiter);

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'AI 分析次数已达上限，请稍后再试' }
});

// Parse JSON
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: '服务器内部错误'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// Export for Vercel serverless
export default app;
