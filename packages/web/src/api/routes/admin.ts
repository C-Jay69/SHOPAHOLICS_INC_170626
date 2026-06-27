import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc, count, sum } from "drizzle-orm";
import { authMiddleware, requireAdmin } from "../middleware/auth";

export const adminRouter = new Hono()
  .use("*", authMiddleware)
  .get("/analytics", requireAdmin, async (c) => {
    const [productCount] = await db.select({ count: count() }).from(schema.products);
    const [customerCount] = await db.select({ count: count() }).from(schema.users).where(eq(schema.users.role, "user"));
    const [orderCount] = await db.select({ count: count() }).from(schema.orders);
    const [revenueResult] = await db.select({ total: sum(schema.orders.total) })
      .from(schema.orders)
      .where(eq(schema.orders.paymentStatus, "paid"));
    const impulseStats = await db.select().from(schema.impulseCoachStats);
    const recentOrders = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(10);

    return c.json({
      products: productCount.count,
      customers: customerCount.count,
      orders: orderCount.count,
      revenue: revenueResult.total || 0,
      impulseCoach: {
        optedIn: impulseStats.filter(s => s.event === "opted_in").length,
        dupesSelected: impulseStats.filter(s => s.event === "dupe_selected").length,
        totalSaved: impulseStats.reduce((s, i) => s + (i.savedAmount || 0), 0),
      },
      recentOrders,
    }, 200);
  })
  .get("/export-csv", requireAdmin, async (c) => {
    const orders = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
    const headers = ["Order Number", "Status", "Payment", "Subtotal", "Tax", "Shipping", "Total", "Date"];
    const rows = orders.map(o => [
      o.orderNumber, o.status, o.paymentStatus,
      o.subtotal, o.tax, o.shipping, o.total,
      new Date(o.createdAt).toISOString(),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="shopaholics-orders-${Date.now()}.csv"`,
      },
    });
  })
  .get("/settings", requireAdmin, async (c) => {
    const settings = await db.select().from(schema.siteSettings);
    const map: Record<string, string> = {};
    settings.forEach(s => { map[s.key] = s.value || ""; });
    return c.json({ settings: map }, 200);
  })
  .post("/settings", requireAdmin, async (c) => {
    const { key, value } = await c.req.json();
    const [existing] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, key));
    if (existing) {
      await db.update(schema.siteSettings).set({ value, updatedAt: new Date() }).where(eq(schema.siteSettings.key, key));
    } else {
      await db.insert(schema.siteSettings).values({ key, value });
    }
    return c.json({ success: true }, 200);
  })
  .post("/seed", requireAdmin, async (c) => {
    const [{ count: catCount }] = await db.select({ count: count() }).from(schema.categories);
    if (catCount === 0) {
      const cats = [
        { name: "Electronics & Computers", slug: "electronics", icon: "Cpu", sortOrder: 1 },
        { name: "Smart Home", slug: "smart-home", icon: "Home", sortOrder: 2 },
        { name: "Fashion", slug: "fashion", icon: "Shirt", sortOrder: 3 },
        { name: "Kids & Baby", slug: "kids-baby", icon: "Baby", sortOrder: 4 },
        { name: "Beauty & Health", slug: "beauty-health", icon: "Heart", sortOrder: 5 },
        { name: "Home & Kitchen", slug: "home-kitchen", icon: "ChefHat", sortOrder: 6 },
        { name: "Automotive & Tools", slug: "automotive-tools", icon: "Wrench", sortOrder: 7 },
        { name: "Pets & Outdoors", slug: "pets-outdoors", icon: "PawPrint", sortOrder: 8 },
        { name: "Arts, Crafts & Hobbies", slug: "arts-crafts", icon: "Palette", sortOrder: 9 },
        { name: "Travel & Luggage", slug: "travel-luggage", icon: "Luggage", sortOrder: 10 },
      ];
      const insertedCats = await db.insert(schema.categories).values(cats).returning();
      const subcatMap: Record<string, string[]> = {
        "electronics": ["Headphones", "Cameras", "Wearable Tech", "Laptops", "Desktops", "Accessories"],
        "smart-home": ["Lights", "Security", "Hubs"],
        "fashion": ["Women's Clothing", "Women's Shoes", "Men's Shirts", "Men's Pants", "Accessories"],
        "kids-baby": ["Girls' Clothing", "Boys' Clothing", "Baby Gear", "Toys"],
        "beauty-health": ["Skincare", "Haircare", "Makeup", "Vitamins", "Personal Care"],
        "home-kitchen": ["Cookware", "Furniture", "Decor", "Cleaning Supplies"],
        "automotive-tools": ["Tools", "Car Care", "Power Tools", "Plumbing"],
        "pets-outdoors": ["Dog Supplies", "Cat Supplies", "Fitness", "Camping", "Cycling"],
        "arts-crafts": ["Painting", "Scrapbooking", "Board Games", "Action Figures"],
        "travel-luggage": ["Suitcases", "Travel Accessories"],
      };
      for (const cat of insertedCats) {
        const subs = subcatMap[cat.slug] || [];
        if (subs.length) {
          await db.insert(schema.subcategories).values(
            subs.map((name, i) => ({
              categoryId: cat.id,
              name,
              slug: `${cat.slug}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
              sortOrder: i,
            }))
          );
        }
      }
    }
    return c.json({ success: true, message: "Database seeded" }, 200);
  })
  .get("/users", requireAdmin, async (c) => {
    const users = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
    }).from(schema.users).orderBy(desc(schema.users.createdAt));
    return c.json({ users }, 200);
  })
  .post("/seed-admin", async (c) => {
    const ADMIN_EMAIL = "admin@shopaholicsinc.store";
    const [existing] = await db.select().from(schema.users)
      .where(eq(schema.users.email, ADMIN_EMAIL));
    if (existing) {
      if (existing.role !== "admin") {
        await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, existing.id));
        return c.json({ success: true, message: "Promoted to admin" }, 200);
      }
      return c.json({ success: true, message: "Admin already exists" }, 200);
    }
    const { auth } = await import("../auth");
    const req = new Request("http://localhost/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Admin", email: ADMIN_EMAIL, password: "ChangeMe123!" }),
    });
    const res = await auth.handler(req);
    if (!res.ok) {
      const text = await res.text();
      return c.json({ error: `Failed to create admin: ${text}` }, 500);
    }
    await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.email, ADMIN_EMAIL));
    return c.json({ success: true, message: "Admin user created" }, 200);
  });
