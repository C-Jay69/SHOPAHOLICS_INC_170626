import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, like, and, gte, lte, desc, asc, or, sql } from "drizzle-orm";
import { authMiddleware, requireAdmin } from "../middleware/auth";

export const productsRouter = new Hono()
  .get("/", async (c) => {
    const { category, subcategory, search, minPrice, maxPrice, brand, rating, sort, page, limit, featured } = c.req.query();
    const pageNum = parseInt(page || "1");
    const limitNum = parseInt(limit || "24");
    const offset = (pageNum - 1) * limitNum;

    let conditions: any[] = [eq(schema.products.status, "active")];

    if (category) {
      const [cat] = await db.select().from(schema.categories).where(eq(schema.categories.slug, category));
      if (cat) conditions.push(eq(schema.products.categoryId, cat.id));
    }
    if (subcategory) {
      const [sub] = await db.select().from(schema.subcategories).where(eq(schema.subcategories.slug, subcategory));
      if (sub) conditions.push(eq(schema.products.subcategoryId, sub.id));
    }
    if (search) {
      conditions.push(or(
        like(schema.products.name, `%${search}%`),
        like(schema.products.brand, `%${search}%`),
        like(schema.products.description, `%${search}%`)
      ));
    }
    if (minPrice) conditions.push(gte(schema.products.price, parseFloat(minPrice)));
    if (maxPrice) conditions.push(lte(schema.products.price, parseFloat(maxPrice)));
    if (brand) conditions.push(eq(schema.products.brand, brand));
    if (rating) conditions.push(gte(schema.products.avgRating, parseFloat(rating)));
    if (featured === "true") conditions.push(eq(schema.products.featured, true));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBy: any = desc(schema.products.createdAt);
    if (sort === "price_asc") orderBy = asc(schema.products.price);
    if (sort === "price_desc") orderBy = desc(schema.products.price);
    if (sort === "rating") orderBy = desc(schema.products.avgRating);
    if (sort === "popular") orderBy = desc(schema.products.reviewCount);

    const [prods, totalResult] = await Promise.all([
      db.select().from(schema.products).where(whereClause).orderBy(orderBy).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(schema.products).where(whereClause),
    ]);

    return c.json({
      products: prods,
      total: totalResult[0]?.count ?? 0,
      page: pageNum,
      limit: limitNum,
    }, 200);
  })
  .get("/search-suggestions", async (c) => {
    const { q } = c.req.query();
    if (!q || q.length < 2) return c.json({ suggestions: [] }, 200);
    const prods = await db.select({ id: schema.products.id, name: schema.products.name, brand: schema.products.brand })
      .from(schema.products)
      .where(and(eq(schema.products.status, "active"), like(schema.products.name, `%${q}%`)))
      .limit(8);
    return c.json({ suggestions: prods }, 200);
  })
  .get("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const [prod] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    if (!prod) return c.json({ error: "Product not found" }, 404);
    const revs = await db.select().from(schema.reviews).where(eq(schema.reviews.productId, id)).orderBy(desc(schema.reviews.createdAt)).limit(20);
    return c.json({ product: prod, reviews: revs }, 200);
  })
  .get("/:id/dupes", async (c) => {
    const id = parseInt(c.req.param("id"));
    const [prod] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    if (!prod) return c.json({ dupes: [] }, 200);
    const maxPrice = prod.price * 0.75;
    const dupes = await db.select().from(schema.products)
      .where(and(
        eq(schema.products.status, "active"),
        eq(schema.products.categoryId, prod.categoryId!),
        lte(schema.products.price, maxPrice),
        sql`${schema.products.id} != ${id}`
      ))
      .orderBy(asc(schema.products.price))
      .limit(4);
    return c.json({ dupes }, 200);
  })
  .post("/", authMiddleware, requireAdmin, async (c) => {
    const body = await c.req.json();
    const [prod] = await db.insert(schema.products).values({
      ...body,
      images: JSON.stringify(body.images || []),
      tags: JSON.stringify(body.tags || []),
      colors: JSON.stringify(body.colors || []),
      sizes: JSON.stringify(body.sizes || []),
      specifications: body.specifications ? JSON.stringify(body.specifications) : null,
      updatedAt: new Date(),
    }).returning();
    return c.json({ product: prod }, 201);
  })
  .put("/:id", authMiddleware, requireAdmin, async (c) => {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const updateData: any = { ...body, updatedAt: new Date() };
    if (body.images) updateData.images = JSON.stringify(body.images);
    if (body.tags) updateData.tags = JSON.stringify(body.tags);
    if (body.colors) updateData.colors = JSON.stringify(body.colors);
    if (body.sizes) updateData.sizes = JSON.stringify(body.sizes);
    if (body.specifications) updateData.specifications = JSON.stringify(body.specifications);
    const [prod] = await db.update(schema.products).set(updateData).where(eq(schema.products.id, id)).returning();
    return c.json({ product: prod }, 200);
  })
  .delete("/:id", authMiddleware, requireAdmin, async (c) => {
    const id = parseInt(c.req.param("id"));
    await db.delete(schema.products).where(eq(schema.products.id, id));
    return c.json({ success: true }, 200);
  })
  .post("/generate-mock", authMiddleware, requireAdmin, async (c) => {
    const { categoryId, count } = await c.req.json();
    const n = Math.min(parseInt(count) || 10, 100);
    const brands = ["TechPro", "NovaBrand", "SwiftGear", "EcoStyle", "PrimePick", "ValueKing", "SmartChoice", "QuickDeal"];
    const adjectives = ["Ultra", "Premium", "Classic", "Pro", "Lite", "Max", "Essential", "Deluxe"];
    const nouns = ["Edition", "Series", "Collection", "Pack", "Bundle", "Set", "Kit", "Model"];
    const generated = [];
    for (let i = 0; i < n; i++) {
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const name = `${brand} ${adj} ${noun} ${Math.floor(Math.random() * 9000) + 1000}`;
      const price = parseFloat((Math.random() * 490 + 10).toFixed(2));
      const sku = `SKU-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + `-${Date.now()}-${i}`;
      const imageCategories = ["electronics", "fashion", "home", "sports", "beauty"];
      const imgCat = imageCategories[Math.floor(Math.random() * imageCategories.length)];
      const imgId = Math.floor(Math.random() * 1000) + 1;
      try {
        const [prod] = await db.insert(schema.products).values({
          name, slug,
          description: `${adj} quality ${noun.toLowerCase()} from ${brand}. Perfect for everyday use with top-tier performance and durability you can count on.`,
          sku, price,
          comparePrice: parseFloat((price * 1.3).toFixed(2)),
          categoryId: categoryId || null,
          brand,
          images: JSON.stringify([`https://picsum.photos/seed/${imgId}/400/400`]),
          tags: JSON.stringify([brand.toLowerCase(), adj.toLowerCase(), "featured"]),
          colors: JSON.stringify(["Black", "White", "Silver"]),
          sizes: JSON.stringify(["S", "M", "L", "XL"]),
          stock: Math.floor(Math.random() * 200) + 10,
          avgRating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
          reviewCount: Math.floor(Math.random() * 500),
          featured: Math.random() > 0.7,
          status: "active",
          updatedAt: new Date(),
        }).returning();
        generated.push(prod);
      } catch (e) { /* skip duplicates */ }
    }
    return c.json({ generated: generated.length, products: generated }, 201);
  });
