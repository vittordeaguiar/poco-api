import { Hono } from "hono";
import { corsMiddleware } from "./middleware/cors";
import { auditRoutes } from "./routes/auditRoutes";
import { authRoutes } from "./routes/authRoutes";
import { dashboardRoutes } from "./routes/dashboardRoutes";
import { exportRoutes } from "./routes/exportRoutes";
import { healthRoutes } from "./routes/healthRoutes";
import { housesRoutes } from "./routes/housesRoutes";
import { invoicesRoutes } from "./routes/invoicesRoutes";
import { lateRoutes } from "./routes/lateRoutes";
import { peopleRoutes } from "./routes/peopleRoutes";
import { wellEventsRoutes } from "./routes/wellEventsRoutes";
import type { AppBindings } from "./types";

const app = new Hono<AppBindings>();

app.use("*", corsMiddleware);

app.route("/", healthRoutes);
app.route("/", authRoutes);
app.route("/", peopleRoutes);
app.route("/", exportRoutes);
app.route("/", auditRoutes);
app.route("/", housesRoutes);
app.route("/", invoicesRoutes);
app.route("/", dashboardRoutes);
app.route("/", lateRoutes);
app.route("/", wellEventsRoutes);

export default app;
