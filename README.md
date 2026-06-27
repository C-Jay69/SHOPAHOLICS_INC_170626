# Shopaholics Inc 🛍️

> The e-commerce platform that enables impulse purchases and then judges you for them.

Full-stack e-commerce platform built with Bun, Vite, React, Hono, Drizzle ORM, better-auth, and Stripe. Includes an AI shopping coach (Shopaholics Anonymous Mate / ImpulseCoach) powered by OpenRouter.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Runtime | Bun |
| Frontend | React + Vite + Tailwind CSS v4 |
| Backend | Hono (API, SSR plugin in dev) |
| ORM | Drizzle |
| Database | Neon (Postgres) |
| Auth | better-auth |
| Payments | Stripe |
| AI | OpenRouter |
| Monorepo | Bun workspaces + Turborepo |

---

## Project Structure

```
.env                          Secrets (gitignored)
packages/
  web/
    src/
      api/
        index.ts              Hono API entry (.basePath('/api'))
        routes/
          admin.ts            Admin routes (products, categories, CSV import)
          auth.ts             Auth routes
          shop.ts             Public shop routes
          ai.ts               ImpulseCoach AI route
        database/
          index.ts            Drizzle client (Neon)
          schema.ts           DB schema
      web/
        pages/
          index.tsx           Landing page
          shop.tsx            Shop / product listing
          product.tsx         Product detail
          cart.tsx            Cart
          checkout.tsx        Checkout
          admin.tsx           Admin panel (products, categories, CSV import, orders)
          auth.tsx            Login / signup
        components/           Shared UI components
        styles.css            Tailwind CSS entry
    seed.ts                   DB seed script (admin user + sample data)
    vite.config.ts            Vite config
```

---

## Local Development

### Prerequisites

- [Bun](https://bun.sh) v1.3+
- A [Neon](https://neon.tech) Postgres database
- A [Stripe](https://stripe.com) account (for payments)
- An [OpenRouter](https://openrouter.ai) API key (for AI coach)

### 1. Clone the repo

```bash
git clone https://github.com/C-Jay69/SHOPAHOLICS_INC_170626.git
cd SHOPAHOLICS_INC_170626
```

### 2. Install dependencies

```bash
bun install
```

### 3. Set up environment variables

Create a `.env` file at the project root:

```env
NODE_ENV=development

# Neon Postgres
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
DATABASE_DIRECT_URL=postgresql://user:pass@host/dbname?sslmode=require

# Auth
BETTER_AUTH_SECRET=your-secret-at-least-32-chars

# App URL
WEBSITE_URL=http://localhost:4200

# Stripe
STRIPE_SECRET_KEY=sk_test_...

# OpenRouter (AI Coach)
OPENROUTER_API_KEY=sk-or-v1-...

# S3-compatible storage (optional, for product image uploads)
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
```

### 4. Push database schema

```bash
cd packages/web
bun --env-file=../../.env run db:push
```

### 5. Seed the database

From the project root:

```bash
cd packages/web
bun --env-file=../../.env run seed.ts
```

This creates:
- Admin user: `admin@shopaholicsinc.store` / `ChangeMe123!`
- 6 product categories
- 3 sample products

**Change the admin password after first login.**

### 6. Start dev server

```bash
bun run dev
```

App runs at `http://localhost:4200`.

---

## Database Commands

All run from `packages/web/`:

```bash
bun run db:push        # Push schema changes directly (dev)
bun run db:generate    # Generate migration files
bun run db:migrate     # Run migrations
bun run db:studio      # Open Drizzle Studio (visual DB browser)
```

---

## Building for Production

```bash
# Build web frontend
cd packages/web
bun --env-file=../../.env run build
```

Output goes to `packages/web/dist/`. The Hono server serves the built frontend statically.

---

## Deployment — Railway

Railway is the recommended deployment target.

### 1. Push to GitHub

```bash
git add .
git commit -m "your message"
git push origin master
```

### 2. Create a Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo**
3. Connect your GitHub account and select `SHOPAHOLICS_INC_170626`

### 3. Configure environment variables

In your Railway service → **Variables**, add every key from your `.env`:

```
NODE_ENV=production
DATABASE_URL=...
DATABASE_DIRECT_URL=...
BETTER_AUTH_SECRET=...
WEBSITE_URL=https://your-railway-domain.up.railway.app
STRIPE_SECRET_KEY=...
OPENROUTER_API_KEY=...
```

> Set `WEBSITE_URL` to your actual Railway-generated domain (or custom domain) — better-auth uses this for CORS and redirects.

### 4. Configure build & start commands

In Railway service → **Settings**:

| Setting | Value |
|---|---|
| Build Command | `bun install && cd packages/web && bun run build` |
| Start Command | `cd packages/web && bun src/server.ts` |
| Watch Paths | `packages/web/src/**` |

Or add a `Dockerfile` to the repo root for full control (see below).

### 5. Run DB push on Railway

After first deploy, open the Railway shell or run a one-off command:

```bash
cd packages/web && bun --env-file=../../.env run db:push
```

Then seed:

```bash
cd packages/web && bun --env-file=../../.env seed.ts
```

### 6. Custom domain (optional)

Railway service → **Settings → Domains** → add your domain and point your DNS there.

---

## Dockerfile (optional)

If Railway auto-detection doesn't work, add this to the project root:

```dockerfile
FROM oven/bun:1.3

WORKDIR /app
COPY . .
RUN bun install
RUN cd packages/web && bun run build

EXPOSE 4200
CMD ["bun", "packages/web/src/server.ts"]
```

---

## Admin Panel

Access at `/admin` after logging in as admin.

**Default credentials:**
- Email: `admin@shopaholicsinc.store`
- Password: `ChangeMe123!`

**Features:**
- Products — add, edit, delete
- Categories — manage categories
- CSV import — bulk import products via CSV upload
- Orders — view all orders

---

## Key Notes

- **Tailwind v4** — uses `@tailwindcss/vite` plugin. Do NOT add global `* { padding: 0; margin: 0 }` after `@import "tailwindcss"` in `styles.css` — it will override all utility classes.
- **Production build** — the platform serves the static `dist/` build. After any frontend change, run `bun run build` in `packages/web/` for changes to take effect.
- **Neon database** — uses Neon's pooled connection for `DATABASE_URL` and direct connection for `DATABASE_DIRECT_URL`. Both are required.
- **Auth** — powered by better-auth. Session cookies are HTTP-only. `BETTER_AUTH_SECRET` must be consistent across restarts.

---

## License

Private — Shopaholics Inc. All rights reserved.
