# Shopaholics Inc — Build Task

## Status: IN PROGRESS

## Completed
- [x] app_init done
- [x] Logo copied to public/logo.png
- [x] Env keys set (OpenRouter, Stripe, BetterAuth, DB)
- [x] design.md written
- [x] better-auth, stripe, bcryptjs installed

## In Progress
- [ ] DB Schema
- [ ] Auth setup (better-auth)
- [ ] API routes
- [ ] Frontend pages

## Build Order
1. DB Schema (users, products, categories, subcategories, orders, order_items, cart_items, reviews, wishlist, site_settings)
2. Auth config + generate schema + push
3. API routes: products, categories, cart, orders, users, admin, impulse-coach
4. Seed data (categories + 80+ products)
5. Frontend: Layout, Nav, Pages
   - / (homepage)
   - /category/:slug
   - /product/:id
   - /cart
   - /checkout
   - /account
   - /search
   - /faq
   - /contact
   - /admin
   - /login /signup
6. Stripe checkout integration
7. Impulse Coach AI widget (OpenRouter)
8. Build + deliver

## Key Decisions
- Payments: Direct Stripe (not Autumn) — checkout sessions + webhooks
- Auth: email/password only via better-auth
- AI: OpenRouter meta-llama/llama-3.1-8b-instruct:free
- Logo: /public/logo.png (neon shopping cart)
- Admin: admin@shopaholicsinc.store / ChangeMe123!
- No animations, no popups
