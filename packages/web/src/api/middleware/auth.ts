import { createMiddleware } from "hono/factory";
import { auth } from "../auth";

export const authMiddleware = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (session) {
    c.set("user", session.user);
    c.set("session", session.session);
  } else {
    c.set("user", null);
    c.set("session", null);
  }
  await next();
});

export const requireAuth = createMiddleware(async (c, next) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  await next();
});

export const requireAdmin = createMiddleware(async (c, next) => {
  const user = c.get("user") as any;
  if (!user || user.role !== "admin") return c.json({ error: "Forbidden" }, 403);
  await next();
});
