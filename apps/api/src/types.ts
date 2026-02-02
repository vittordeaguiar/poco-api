import type { Context, MiddlewareHandler } from "hono";

export type Env = {
  poco_db: D1Database;
  API_KEY?: string;
  DEFAULT_AMOUNT_CENTS?: string;
  CORS_ORIGINS?: string;
};

export type AppBindings = { Bindings: Env };
export type AppContext = Context<AppBindings>;
export type AppHandler = (c: AppContext) => Response | Promise<Response>;
export type AppMiddleware = MiddlewareHandler<AppBindings>;
