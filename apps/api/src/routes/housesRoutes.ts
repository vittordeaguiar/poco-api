import { Hono } from "hono";
import {
  assignResponsibleHandler,
  deleteHouseHandler,
  getHouseHandler,
  listHousesHandler,
  listPendingHousesHandler,
  quickCreateHouseHandler,
  updateHouseHandler
} from "../controllers/housesController";
import { authGuard } from "../middleware/auth";
import type { AppBindings } from "../types";

export const housesRoutes = new Hono<AppBindings>();

housesRoutes.use("*", authGuard);
housesRoutes.get("/houses", listHousesHandler);
housesRoutes.get("/houses/pending", listPendingHousesHandler);
housesRoutes.get("/houses/:id", getHouseHandler);
housesRoutes.put("/houses/:id", updateHouseHandler);
housesRoutes.delete("/houses/:id", deleteHouseHandler);
housesRoutes.post("/houses/:id/responsible", assignResponsibleHandler);
housesRoutes.post("/houses/quick", quickCreateHouseHandler);
