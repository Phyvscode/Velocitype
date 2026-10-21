import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { connectDB } from './config/db.js';
import { getAllowedOrigins } from './config/security.js';
import { enforceHttps, sanitizeRequest, securityHeaders } from './middleware/security.js';
import authRoutes from './routes/authRoutes.js';
import wordRoutes from './routes/wordRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import sentenceRoutes from './routes/sentenceRoutes.js';
import { initSocket } from './services/socketService.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Init Socket.io
initSocket(httpServer);

// Security & HTTPS enforcement
app.use(enforceHttps);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:', 'ws:', 'wss:'],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(securityHeaders);

// CORS configuration with origin allowlist
const allowedOrigins = getAllowedOrigins();
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin, server-to-server, curl/tests) or in allowlist
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS policy'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  })
);

// Body parsers & NoSQL/prototype-pollution sanitization
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ limit: '6mb', extended: true }));
app.use(sanitizeRequest);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/sentences', sentenceRoutes);

// Health check endpoints
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Velocitype Backend API',
    status: 'online',
    version: '1.0.0',
    language: 'TypeScript',
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? 'ok' : 'degraded',
    database: dbReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for unknown API routes
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Safe error handling middleware (never leaks stack traces to clients)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request payload too large' });
  }
  if (err?.message === 'Origin not allowed by CORS policy') {
    return res.status(403).json({ message: 'CORS policy: Origin not allowed' });
  }
  console.error('Unhandled Error:', err?.message || err);
  return res.status(500).json({ message: 'Internal Server Error' });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Velocitype TypeScript Backend running on port ${PORT} (http://localhost:${PORT})`);
});
