import { db } from "./src/api/database";
import * as schema from "./src/api/database/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const adminEmail = "admin@shopaholicsinc.store";
const adminPassword = "ChangeMe123!";

async function seed() {
  // Check if admin exists
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, adminEmail));
  if (existing.length > 0) {
    console.log("Admin already exists — updating role");
    await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.email, adminEmail));
    return;
  }

  // Hash password using bcryptjs
  const { default: bcrypt } = await import("bcryptjs");
  const hash = await bcrypt.hash(adminPassword, 12);
  const userId = randomUUID();
  const accountId = randomUUID();
  const now = new Date();

  await db.insert(schema.users).values({
    id: userId,
    name: "Admin",
    email: adminEmail,
    emailVerified: true,
    role: "admin",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(schema.accounts).values({
    id: accountId,
    accountId: userId,
    providerId: "credential",
    userId,
    password: hash,
    createdAt: now,
    updatedAt: now,
  });

  console.log("✅ Admin seeded:", adminEmail);

  // Seed sample categories
  const cats = [
    { name: "Electronics", slug: "electronics", icon: "💻", sortOrder: 1 },
    { name: "Fashion", slug: "fashion", icon: "👗", sortOrder: 2 },
    { name: "Home & Living", slug: "home-living", icon: "🏠", sortOrder: 3 },
    { name: "Beauty", slug: "beauty", icon: "💄", sortOrder: 4 },
    { name: "Sports", slug: "sports", icon: "⚽", sortOrder: 5 },
    { name: "Toys", slug: "toys", icon: "🎮", sortOrder: 6 },
  ];
  for (const cat of cats) {
    await db.insert(schema.categories).values({ ...cat, createdAt: now }).onConflictDoNothing();
  }
  console.log("✅ Categories seeded");

  // Seed sample products
  const [elec] = await db.select().from(schema.categories).where(eq(schema.categories.slug, "electronics"));
  const [fashion] = await db.select().from(schema.categories).where(eq(schema.categories.slug, "fashion"));

  const products = [
    {
      name: "Wireless Noise-Cancelling Headphones",
      slug: "wireless-noise-cancelling-headphones",
      description: "Premium sound. Zero distractions. Your wallet, though — RIP.",
      sku: "ELEC-001",
      price: 299.99,
      comparePrice: 399.99,
      discount: 25,
      categoryId: elec?.id,
      brand: "SonicBoom",
      images: JSON.stringify(["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"]),
      stock: 42,
      featured: true,
      status: "active" as const,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Smart Watch Pro",
      slug: "smart-watch-pro",
      description: "Tells time AND judges your steps. Mostly judges.",
      sku: "ELEC-002",
      price: 199.99,
      comparePrice: 249.99,
      discount: 20,
      categoryId: elec?.id,
      brand: "TimeTech",
      images: JSON.stringify(["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"]),
      stock: 28,
      featured: true,
      status: "active" as const,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Oversized Hoodie",
      slug: "oversized-hoodie",
      description: "Perfect for hiding from responsibilities. Very breathable.",
      sku: "FASH-001",
      price: 59.99,
      comparePrice: 89.99,
      discount: 33,
      categoryId: fashion?.id,
      brand: "CozyWear",
      images: JSON.stringify(["https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=500"]),
      stock: 100,
      colors: JSON.stringify(["Black", "Grey", "Navy"]),
      sizes: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
      featured: true,
      status: "active" as const,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const p of products) {
    await db.insert(schema.products).values(p).onConflictDoNothing();
  }
  console.log("✅ Sample products seeded");
}

seed().then(() => { console.log("Done."); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
