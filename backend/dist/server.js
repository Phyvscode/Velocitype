import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import wordRoutes from './routes/wordRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// Connect to MongoDB
connectDB();
// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/results', resultRoutes);
// Health check endpoint
app.get('/', (_req, res) => {
    res.json({
        name: 'Velocitype Backend API',
        status: 'online',
        version: '1.0.0',
        language: 'TypeScript',
    });
});
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
});
app.listen(PORT, () => {
    console.log(`🚀 Velocitype TypeScript Backend running on port ${PORT} (http://localhost:${PORT})`);
});
