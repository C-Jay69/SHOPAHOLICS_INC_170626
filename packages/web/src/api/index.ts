import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { categoriesRouter } from "./routes/categories";
import { productsRouter } from "./routes/products";
import { cartRouter } from "./routes/cart";
import { ordersRouter, adminOrdersRouter } from "./routes/orders";
import { reviewsRouter } from "./routes/reviews";
import { impulseRouter } from "./routes/impulse";
import { usersRouter, adminUsersRouter } from "./routes/users";
import { adminRouter } from "./routes/admin";

const app = new Hono();

app.use("*", cors({
  origin: (origin) => origin || "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

// Health check
app.get("/api/ping", (c) => c.json({ ok: true, ts: Date.now() }));

// Better-auth handler — must match all methods and all subpaths
app.all("/api/auth/*", (c) => auth.handler(c.req.raw));

// API routes
app.route("/api/categories", categoriesRouter);
app.route("/api/products", productsRouter);
app.route("/api/cart", cartRouter);
app.route("/api/orders", ordersRouter);
app.route("/api/reviews", reviewsRouter);
app.route("/api/impulse", impulseRouter);
app.route("/api/users", usersRouter);
app.route("/api/admin", adminRouter);
app.route("/api/admin/orders", adminOrdersRouter);
app.route("/api/admin/users", adminUsersRouter);

export default app;
