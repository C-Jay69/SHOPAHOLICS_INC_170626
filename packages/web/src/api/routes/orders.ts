import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, requireAuth, requireAdmin } from "../middleware/auth";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2025-04-30.basil" as any });
}

const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:4200";

export const ordersRouter = new Hono()
  .use("*", authMiddleware)
  .get("/", requireAuth, async (c) => {
    const user = c.get("user") as any;
    const orders = await db.select().from(schema.orders)
      .where(eq(schema.orders.userId, user.id))
      .orderBy(desc(schema.orders.createdAt));
    return c.json({ orders }, 200);
  })
  .get("/:id", requireAuth, async (c) => {
    const id = parseInt(c.req.param("id"));
    const user = c.get("user") as any;
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    if (!order) return c.json({ error: "Order not found" }, 404);
    if (order.userId !== user.id && (user as any).role !== "admin") return c.json({ error: "Forbidden" }, 403);
    const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));
    return c.json({ order, items }, 200);
  })
  .post("/checkout-session", async (c) => {
    const { items, shippingAddress, email } = await c.req.json();
    const user = c.get("user") as any;
    if (!items || items.length === 0) return c.json({ error: "Cart is empty" }, 400);

    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.productName,
          images: item.productImages ? [JSON.parse(item.productImages)[0]].filter(Boolean) : [],
        },
        unit_amount: Math.round(item.productPrice * 100),
      },
      quantity: item.quantity,
    }));

    const orderNumber = `SI-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const subtotal = items.reduce((sum: number, i: any) => sum + i.productPrice * i.quantity, 0);
    const tax = parseFloat((subtotal * 0.08).toFixed(2));
    const shipping = subtotal > 50 ? 0 : 9.99;
    const total = subtotal + tax + shipping;

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${WEBSITE_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${WEBSITE_URL}/cart`,
      customer_email: user?.email || email,
      metadata: {
        orderNumber,
        userId: user?.id || "",
        guestEmail: email || "",
        shippingAddress: JSON.stringify(shippingAddress),
      },
    });

    const [order] = await db.insert(schema.orders).values({
      orderNumber,
      userId: user?.id || null,
      guestEmail: email || null,
      status: "pending",
      subtotal,
      shipping,
      tax,
      total,
      shippingAddress: JSON.stringify(shippingAddress),
      stripeSessionId: session.id,
      paymentStatus: "pending",
      updatedAt: new Date(),
    }).returning();

    for (const item of items) {
      const imgs = (() => { try { return JSON.parse(item.productImages); } catch { return []; } })();
      await db.insert(schema.orderItems).values({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku || `SKU-${item.productId}`,
        productImage: imgs[0] || null,
        price: item.productPrice,
        quantity: item.quantity,
        selectedColor: item.selectedColor || null,
        selectedSize: item.selectedSize || null,
      });
    }

    return c.json({ url: session.url, orderId: order.id }, 200);
  })
  .get("/success/:sessionId", async (c) => {
    const sessionId = c.req.param("sessionId");
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.stripeSessionId, sessionId));
    if (order && session.payment_status === "paid") {
      await db.update(schema.orders)
        .set({ paymentStatus: "paid", status: "processing", updatedAt: new Date() })
        .where(eq(schema.orders.id, order.id));
    }
    return c.json({ order, session: { status: session.payment_status } }, 200);
  });

export const adminOrdersRouter = new Hono()
  .use("*", authMiddleware)
  .get("/", requireAdmin, async (c) => {
    const orders = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
    return c.json({ orders }, 200);
  })
  .put("/:id/status", requireAdmin, async (c) => {
    const id = parseInt(c.req.param("id"));
    const { status } = await c.req.json();
    const [order] = await db.update(schema.orders).set({ status, updatedAt: new Date() }).where(eq(schema.orders.id, id)).returning();
    return c.json({ order }, 200);
  });
