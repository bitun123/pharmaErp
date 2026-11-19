import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import cors from 'cors';
import { auth } from './module/auth/config/auth.js';
import { helmetConfig } from './config/helmet.js';
import mediaRoutes from './module/media/routes.js';
import shopRoutes from './module/shop/routes.js';
import { errorHandler } from './middlewares/error-handler.js';

const app = express();

// FRONTEND_URL can hold several origins, comma-separated.
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// CORS must come before the auth handler so preflight (OPTIONS) requests are answered.
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // needed for the session cookie
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Security middleware
app.use(helmetConfig);

app.all('/api/auth/*splat', toNodeHandler(auth));
app.use(express.json());

// Media routes (Upload, Delete, Image Details, Client Auth)
app.use('/api/media', mediaRoutes);

// Shop routes (Create, Read, Update, Delete, Search, Pagination) - all under /api/shop
app.use('/api/shop', shopRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
