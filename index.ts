import { Hono } from 'hono';
import { cors } from "hono/cors";
import { auth } from "./auth";
import { authMiddleware } from "./middleware/auth";
import { categoriesRouter } from "./routes/categories";
import { productsRouter } from "./routes/products";
import { cartRouter } from "./routes/cart";
import { ordersRouter, adminOrdersRouter } from "./routes/orders";
import { usersRouter, adminUsersRouter } from "./routes/users";
import { reviewsRouter } from "./routes/reviews";
import { impulseRouter } from "./routes/impulse";
import { adminRouter } from "./routes/admin";

const app = new Hono()
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true, exposeHeaders: ["set-auth-token"] }))
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .basePath('api')
  .use("*", authMiddleware)
  .get('/ping', (c) => c.json({ message: `Pong! ${Date.now()}` }, 200))
  .get('/health', (c) => c.json({ status: 'ok' }, 200))
  .route("/categories", categoriesRouter)
  .route("/products", productsRouter)
  .route("/cart", cartRouter)
  .route("/orders", ordersRouter)
  .route("/reviews", reviewsRouter)
  .route("/impulse", impulseRouter)
  .route("/users", usersRouter)
  .route("/admin", adminRouter)
  .route("/admin/orders", adminOrdersRouter)
  .route("/admin/users", adminUsersRouter);

export type AppType = typeof app;
export default app;
