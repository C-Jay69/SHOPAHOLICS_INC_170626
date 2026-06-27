import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware, requireAuth, requireAdmin } from "../middleware/auth";

export const usersRouter = new Hono()
  .use("*", authMiddleware)
  .get("/me", requireAuth, async (c) => {
    const user = c.get("user") as any;
    return c.json({ user }, 200);
  })
  .get("/wishlist", requireAuth, async (c) => {
    const user = c.get("user") as any;
    const items = await db.select({
      id: schema.wishlist.id,
      productId: schema.wishlist.productId,
      createdAt: schema.wishlist.createdAt,
      productName: schema.products.name,
      productPrice: schema.products.price,
      productImages: schema.products.images,
      productSlug: schema.products.slug,
      productBrand: schema.products.brand,
      productAvgRating: schema.products.avgRating,
    })
      .from(schema.wishlist)
      .leftJoin(schema.products, eq(schema.wishlist.productId, schema.products.id))
      .where(eq(schema.wishlist.userId, user.id));
    return c.json({ items }, 200);
  })
  .post("/wishlist/:productId", requireAuth, async (c) => {
    const user = c.get("user") as any;
    const productId = parseInt(c.req.param("productId"));
    const [existing] = await db.select().from(schema.wishlist)
      .where(and(eq(schema.wishlist.userId, user.id), eq(schema.wishlist.productId, productId)));
    if (existing) {
      await db.delete(schema.wishlist).where(eq(schema.wishlist.id, existing.id));
      return c.json({ wishlisted: false }, 200);
    }
    await db.insert(schema.wishlist).values({ userId: user.id, productId });
    return c.json({ wishlisted: true }, 200);
  })
  .get("/addresses", requireAuth, async (c) => {
    const user = c.get("user") as any;
    const addrs = await db.select().from(schema.addresses).where(eq(schema.addresses.userId, user.id));
    return c.json({ addresses: addrs }, 200);
  })
  .post("/addresses", requireAuth, async (c) => {
    const user = c.get("user") as any;
    const body = await c.req.json();
    const [addr] = await db.insert(schema.addresses).values({ ...body, userId: user.id }).returning();
    return c.json({ address: addr }, 201);
  })
  .delete("/addresses/:id", requireAuth, async (c) => {
    const id = parseInt(c.req.param("id"));
    const user = c.get("user") as any;
    await db.delete(schema.addresses).where(and(eq(schema.addresses.id, id), eq(schema.addresses.userId, user.id)));
    return c.json({ success: true }, 200);
  });

export const adminUsersRouter = new Hono()
  .use("*", authMiddleware)
  .get("/", requireAdmin, async (c) => {
    const allUsers = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
    }).from(schema.users);
    return c.json({ users: allUsers }, 200);
  });
