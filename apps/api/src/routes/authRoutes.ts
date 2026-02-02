import { Hono } from "hono";
import { login } from "../controllers/authController";
import type { AppBindings } from "../types";

export const authRoutes = new Hono<AppBindings>();

authRoutes.post("/auth/login", login);
