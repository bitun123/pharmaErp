import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./modules/auth/config/auth.ts";
const app = express();

app.all("/api/auth/*splat",toNodeHandler(auth));