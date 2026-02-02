import { Hono } from "hono";
import {
  createWellEventHandler,
  listWellEventsHandler
} from "../controllers/wellEventsController";
import { authGuard } from "../middleware/auth";
import type { AppBindings } from "../types";

export const wellEventsRoutes = new Hono<AppBindings>();

wellEventsRoutes.use("*", authGuard);
wellEventsRoutes.post("/well-events", createWellEventHandler);
wellEventsRoutes.get("/well-events", listWellEventsHandler);
