import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { authMiddleware } from "../middleware/auth";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free";

export const impulseRouter = new Hono()
  .use("*", authMiddleware)
  .post("/analyze", async (c) => {
    const { items, totalAmount, hour } = await c.req.json();
    const user = c.get("user") as any;

    if (!items || items.length === 0) {
      return c.json({ message: "Nothing in your cart yet, mate. Off to a good start!", type: "empty" }, 200);
    }

    const cartSummary = items.map((i: any) => `${i.quantity}x ${i.productName} ($${i.productPrice})`).join(", ");
    const timeContext = hour >= 22 || hour <= 4 ? "at 2am" : "right now";

    try {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://shopaholicsinc.store",
          "X-Title": "Shopaholics Inc Impulse Coach",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            {
              role: "system",
              content: `You are the Shopaholics Anonymous Mate — a witty, sarcastic but genuinely helpful AI shopping coach. Your job is to give a short, punchy 1-2 sentence reaction to what's in someone's cart. Be cheeky and British-sarcastic but actually helpful. Suggest saving to wishlist or cooling off if it seems impulsive. Never be mean, always be funny. Keep it to 1-2 sentences max. No hashtags, no emojis.`
            },
            {
              role: "user",
              content: `Cart ${timeContext}: ${cartSummary}. Total: $${totalAmount.toFixed(2)}. Give me your honest, sarcastic take.`
            }
          ],
          max_tokens: 100,
          temperature: 0.8,
        }),
      });

      if (!resp.ok) throw new Error("AI offline");

      const data = await resp.json() as any;
      const message = data.choices?.[0]?.message?.content || "Your cart's looking... ambitious. Just sayin'.";

      // Log stat
      if (user) {
        await db.insert(schema.impulseCoachStats).values({
          userId: user.id,
          event: "analyzed",
          savedAmount: 0,
        });
      }

      return c.json({ message, type: "analysis" }, 200);
    } catch (e) {
      // Fallback sarcastic messages
      const fallbacks = [
        `${items.length} items at $${totalAmount.toFixed(2)}? Bold move, mate. Sure you don't want to sleep on it?`,
        `Cart's heavier than a Sunday roast. Every single item necessary? Thought not.`,
        `$${totalAmount.toFixed(2)} later and you'll still wonder why you're broke. Just an observation.`,
        `Your future self is either going to thank you or roast you. Probably both.`,
      ];
      return c.json({ message: fallbacks[Math.floor(Math.random() * fallbacks.length)], type: "fallback" }, 200);
    }
  })
  .post("/log", async (c) => {
    const user = c.get("user") as any;
    const { event, productId, savedAmount, sessionId } = await c.req.json();
    await db.insert(schema.impulseCoachStats).values({
      userId: user?.id || null,
      sessionId: sessionId || null,
      event,
      productId: productId || null,
      savedAmount: savedAmount || 0,
    });
    return c.json({ success: true }, 200);
  })
  .get("/stats", async (c) => {
    const stats = await db.select().from(schema.impulseCoachStats);
    const optedIn = stats.filter(s => s.event === "opted_in").length;
    const dupeSelected = stats.filter(s => s.event === "dupe_selected").length;
    const totalSaved = stats.reduce((sum, s) => sum + (s.savedAmount || 0), 0);
    return c.json({ optedIn, dupeSelected, totalSaved, totalEvents: stats.length }, 200);
  });
