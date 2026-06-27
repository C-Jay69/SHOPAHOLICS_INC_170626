import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

export const cartRouter = new Hono()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const user = c.get("user") as any;
    const sessionId = c.req.header("x-session-id") || "guest";
    const condition = user
      ? eq(schema.cartItems.userId, user.id)
      : eq(schema.cartItems.sessionId, sessionId);
    const items = await db.select({
      id: schema.cartItems.id,
      quantity: schema.cartItems.quantity,
      selectedColor: schema.cartItems.selectedColor,
      selectedSize: schema.cartItems.selectedSize,
      sessionId: schema.cartItems.sessionId,
      userId: schema.cartItems.userId,
      productId: schema.cartItems.productId,
      productName: schema.products.name,
      productPrice: schema.products.price,
      productImages: schema.products.images,
      productStock: schema.products.stock,
      productSlug: schema.products.slug,
      productBrand: schema.products.brand,
      productSku: schema.products.sku,
    })
      .from(schema.cartItems)
      .leftJoin(schema.products, eq(schema.cartItems.productId, schema.products.id))
      .where(condition);
    return c.json({ items }, 200);
  })
  .post("/", async (c) => {
    const user = c.get("user") as any;
    const sessionId = c.req.header("x-session-id") || "guest";
    const { productId, quantity, selectedColor, selectedSize } = await c.req.json();
    const condition = user
      ? and(eq(schema.cartItems.userId, user.id), eq(schema.cartItems.productId, productId))
      : and(eq(schema.cartItems.sessionId, sessionId), eq(schema.cartItems.productId, productId));
    const [existing] = await db.select().from(schema.cartItems).where(condition);
    if (existing) {
      const [updated] = await db.update(schema.cartItems)
        .set({ quantity: existing.quantity + (quantity || 1) })
        .where(eq(schema.cartItems.id, existing.id))
        .returning();
      return c.json({ item: updated }, 200);
    }
    const [item] = await db.insert(schema.cartItems).values({
      sessionId,
      userId: user?.id || null,
      productId,
      quantity: quantity || 1,
      selectedColor,
      selectedSize,
    }).returning();
    return c.json({ item }, 201);
  })
  .put("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const { quantity } = await c.req.json();
    if (quantity <= 0) {
      await db.delete(schema.cartItems).where(eq(schema.cartItems.id, id));
      return c.json({ success: true, deleted: true }, 200);
    }
    const [item] = await db.update(schema.cartItems).set({ quantity }).where(eq(schema.cartItems.id, id)).returning();
    return c.json({ item }, 200);
  })
  .delete("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    await db.delete(schema.cartItems).where(eq(schema.cartItems.id, id));
    return c.json({ success: true }, 200);
  })
  .delete("/", async (c) => {
    const user = c.get("user") as any;
    const sessionId = c.req.header("x-session-id") || "guest";
    const condition = user
      ? eq(schema.cartItems.userId, user.id)
      : eq(schema.cartItems.sessionId, sessionId);
    await db.delete(schema.cartItems).where(condition);
    return c.json({ success: true }, 200);
  });
