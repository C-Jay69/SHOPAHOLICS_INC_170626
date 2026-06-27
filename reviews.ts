import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, avg, count } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";

export const reviewsRouter = new Hono()
  .use("*", authMiddleware)
  .post("/", requireAuth, async (c) => {
    const user = c.get("user") as any;
    const { productId, rating, title, body } = await c.req.json();
    const [review] = await db.insert(schema.reviews).values({
      productId,
      userId: user.id,
      rating,
      title,
      body,
    }).returning();

    // Update product avg rating
    const [stats] = await db.select({
      avg: avg(schema.reviews.rating),
      count: count(schema.reviews.id),
    }).from(schema.reviews).where(eq(schema.reviews.productId, productId));

    await db.update(schema.products).set({
      avgRating: parseFloat(stats.avg || "0"),
      reviewCount: stats.count,
      updatedAt: new Date(),
    }).where(eq(schema.products.id, productId));

    return c.json({ review }, 201);
  });
