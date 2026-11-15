import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import { auth } from './module/auth/config/auth.js';

const app = express();
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json())

export default app;