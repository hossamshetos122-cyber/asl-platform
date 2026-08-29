# ASL Platform — دوري نجوم الإسكندرية

Amateur football league management platform for Alexandria, Egypt. Built with Next.js 15, Prisma ORM, Tailwind CSS, and a full Arabic RTL design system.

## Features

- Public league website with standings, top scorers, team profiles, match results
- Admin dashboard with CRUD for tournaments, teams, players, matches
- Automatic standings calculation (W/D/L, points, goal difference)
- Automatic top scorers from match events
- Session-based authentication with role-based access control
- Responsive Arabic RTL design

## Prerequisites

- Node.js 18+ (recommended: 20+)
- npm
- PostgreSQL (production) or SQLite (local development)

---

## Local Development (SQLite)

No database server required. Uses a local SQLite file.

### 1. Install dependencies

```bash
npm install
```

### 2. Switch schema to SQLite

Open `prisma/schema.prisma` and change the provider:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

Make sure `.env` contains:

```env
DATABASE_URL="file:./dev.db"
```

### 3. Set up database and seed

```bash
npx prisma db push
npm run db:seed
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | (set via `db:rotate:admin`, not committed) | (generated strong password) |

Admin credentials are **not** stored in the repository. Run `npm run db:rotate:admin` after configuring the env vars in your gitignored `.env` (see Step 9 below).

---

## Production Deployment (PostgreSQL + Vercel)

### Step 1: Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name the repository (e.g., `asl-platform`)
3. Do **NOT** initialize with README (we already have one)
4. Create the repository
5. Push the code:

```bash
cd "path/to/asl-platform 2"
git init
git add .
git commit -m "Initial deployment"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Step 2: Create a PostgreSQL Database

Use a free-tier provider:

**Option A — Neon (Recommended):**
1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string (it looks like `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/asl_db?sslmode=require`)

**Option B — Supabase:**
1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to Settings → Database → Connection string → URI
4. Copy the connection string

**Option C — Railway / Render / any PostgreSQL host:**
1. Create a PostgreSQL instance
2. Copy the connection string

### Step 3: Get the DATABASE_URL

Your PostgreSQL connection string should look like:

```
postgresql://username:password@host:5432/database_name?schema=public
```

Keep this ready — you'll need it in Step 5.

### Step 4: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"Add New..." → "Project"**
3. Find your repository and click **"Import"**
4. Vercel auto-detects Next.js — no config changes needed
5. Click **"Deploy"** (it will fail without env vars — that's expected)

### Step 5: Add Vercel Environment Variables

In your Vercel project dashboard:

1. Go to **Settings → Environment Variables**
2. Add these three variables:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | Your PostgreSQL connection string from Step 3 | Production, Preview, Development |
| `SESSION_SECRET` | A random 64-character hex string (see below) | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

**Generate SESSION_SECRET:**

Run this locally and copy the output:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 6: Run Prisma Production Migrations

After setting environment variables, you need to initialize the database schema.

**Option A — From Vercel CLI (recommended):**

```bash
npm i -g vercel
vercel login
vercel env pull .env.local
npx prisma migrate deploy
```

**Option B — From a local PostgreSQL connection:**

If you have PostgreSQL running locally with the same connection string:

```bash
npx prisma migrate deploy
npm run db:seed
```

**Option C — Using prisma db push (quick setup):**

```bash
npx prisma db push
npm run db:seed
```

### Step 7: Deploy

After setting env vars and running migrations:

1. Go to your Vercel project dashboard
2. Click **"Deployments"** → **"Redeploy"** on the latest deployment
3. The `postinstall` script automatically runs `prisma generate`
4. Wait for the build to complete (~1-2 minutes)

### Step 8: Test the Live Website

1. Vercel gives you a URL like `https://your-project.vercel.app`
2. Visit the URL — you should see the Arabic league homepage
3. Check these pages work:
   - `/` — Home page with standings, live match, fixtures
   - `/standings` — League table
   - `/top-scorers` — Top scorers
   - `/matches` — All matches
   - `/teams` — All teams
   - `/tournaments` — All tournaments
4. Test admin login at `/login` with the seeded credentials (if you ran `db:seed`)

### Step 9: Set the Real Admin Credentials

**Before real use**, set a strong admin password and a real admin email. The
seeded defaults are only for local/demo use.

1. Add the following to your local (gitignored) `.env`:
   - `DATABASE_URL` — your live PostgreSQL connection string
   - `ROTATE_ADMIN_EMAIL` — your real email address (used to sign in as admin)
   - `ROTATE_ADMIN_PASSWORD` — a strong password (16+ chars, upper/lower/digits/symbols)
   - `ROTATE_ORGANIZER_PASSWORD` — a strong password for the organizer account
2. Run the rotation script:

```bash
npm run db:rotate:admin
```

This updates the admin user (email + password) and the organizer (password) in
the database and revokes their existing sessions. The passwords are read from
`.env` only — they are never committed to the repository.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./dev.db` | PostgreSQL connection string (production) or SQLite file path (development) |
| `SESSION_SECRET` | Production | (empty) | Random secret for session cookies. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | No | `development` | `development`, `production`, or `test` |
| `SESSION_COOKIE_NAME` | No | `session` | Custom session cookie name |

---

## Database Commands

```bash
npx prisma generate          # Generate Prisma client
npx prisma db push           # Push schema to database (dev)
npx prisma migrate dev       # Create migration (dev)
npx prisma migrate deploy    # Apply migrations (prod)
npm run db:seed              # Seed demo data
npx prisma studio            # Open database browser
```

### Switching Between SQLite and PostgreSQL

The schema supports both providers:

1. Change `provider` in `prisma/schema.prisma` (`"sqlite"` or `"postgresql"`)
2. Update `DATABASE_URL` in `.env`
3. Run `npx prisma db push` or `npx prisma migrate dev`

---

## Project Structure

```
├── prisma/
│   ├── schema.prisma        # Database schema (PostgreSQL)
│   ├── seed.ts              # Demo data seeder
│   └── dev.db               # SQLite database (local dev only)
├── src/
│   ├── app/
│   │   ├── admin/           # Admin dashboard pages
│   │   ├── api/             # API routes
│   │   ├── login/           # Login page
│   │   ├── register/        # Registration page
│   │   ├── matches/         # Public match pages
│   │   ├── standings/       # League table
│   │   ├── teams/           # Team pages
│   │   ├── top-scorers/     # Top scorers
│   │   └── tournaments/     # Tournament pages
│   ├── components/          # UI components
│   └── lib/
│       ├── actions/         # Server actions (CRUD)
│       ├── auth.ts          # Authentication logic
│       ├── data/            # Data access layer
│       ├── prisma.ts        # Prisma client singleton
│       └── types/           # TypeScript view models
├── .env.example             # Environment template
├── .env.production.example  # Production template
├── vercel.json              # Vercel configuration
└── next.config.mjs          # Next.js configuration
```

## License

Private — Alexandria Amateur Football League.
