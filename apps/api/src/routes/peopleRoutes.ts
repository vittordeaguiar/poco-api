import { Hono } from "hono";
import {
  createPersonHandler,
  listPeopleHandler
} from "../controllers/peopleController";
import { authGuard } from "../middleware/auth";
import type { AppBindings } from "../types";

export const peopleRoutes = new Hono<AppBindings>();

peopleRoutes.use("*", authGuard);
peopleRoutes.get("/people", listPeopleHandler);
peopleRoutes.post("/people", createPersonHandler);
