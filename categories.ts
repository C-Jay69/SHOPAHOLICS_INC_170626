import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";

export const categoriesRouter = new Hono()
  .get("/", async (c) => {
    const cats = await db.select().from(schema.categories).orderBy(schema.categories.sortOrder);
    const subs = await db.select().from(schema.subcategories).orderBy(schema.subcategories.sortOrder);
    const result = cats.map(cat => ({
      ...cat,
      subcategories: subs.filter(s => s.categoryId === cat.id),
    }));
    return c.json({ categories: result }, 200);
  })
  .get("/:slug", async (c) => {
    const slug = c.req.param("slug");
    const [cat] = await db.select().from(schema.categories).where(eq(schema.categories.slug, slug));
    if (!cat) return c.json({ error: "Category not found" }, 404);
    const subs = await db.select().from(schema.subcategories).where(eq(schema.subcategories.categoryId, cat.id));
    return c.json({ category: { ...cat, subcategories: subs } }, 200);
  })
  .post("/", requireAdmin, async (c) => {
    const body = await c.req.json();
    const [cat] = await db.insert(schema.categories).values(body).returning();
    return c.json({ category: cat }, 201);
  })
  .put("/:id", requireAdmin, async (c) => {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const [cat] = await db.update(schema.categories).set(body).where(eq(schema.categories.id, id)).returning();
    return c.json({ category: cat }, 200);
  })
  .delete("/:id", requireAdmin, async (c) => {
    const id = parseInt(c.req.param("id"));
    await db.delete(schema.categories).where(eq(schema.categories.id, id));
    return c.json({ success: true }, 200);
  });
