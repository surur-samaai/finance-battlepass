# Finance Battle Pass

Turn your budget into a game. A personal finance gamification app inspired by battle-pass progression: earn XP from spending discipline, level up for wishlist tokens, and survive the Gulag when you break your quests.

**Live demo:** _Add your Vercel URL after deploy_

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL
- **Auth:** Google OAuth 2.0 (Passport.js + express-session)
- **Deploy:** Railway (API + DB), Vercel (client)

## Local development

### Prerequisites

- Node.js 20+
- PostgreSQL (local or Supabase)
- Google Cloud OAuth credentials

### 1. Database

Create a database and run migrations in order:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/finance_battle_pass"
for f in server/db/migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
```

### 2. Backend

```bash
cp .env.example server/.env
# Edit server/.env: DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET
# Optional: API_URL=http://localhost:3000, CLIENT_URL=http://localhost:5173

npm install
npm run dev
```

Server runs at `http://localhost:3000`. Health check: `GET /health` → `{ "status": "ok" }`.

In Google Cloud Console, set the authorized redirect URI to:

`http://localhost:3000/auth/google/callback`

### 3. Frontend

```bash
cd client
cp .env.example .env
# VITE_API_URL=http://localhost:3000

npm install
npm run dev
```

Client runs at `http://localhost:5173`.

### 4. Tests

From the repo root:

```bash
npm test
```

## Portfolio reviewers

The **DevTools** panel on the Dashboard fires mock bank webhooks (no real bank integration). Use it to trigger XP gains, Gulag state, and redemption flows without external services.

Run **Reset Season** once before sharing so Season History shows an archived season.

## Deploy

### Backend (Railway)

1. Create a Railway project and add the PostgreSQL plugin.
2. Deploy this repo from the root. Build: `npm run build`. Start: `npm start`.
3. Run all files in `server/db/migrations/` against the Railway `DATABASE_URL` (SQL console or `psql`).
4. Set environment variables:

   | Variable | Example |
   |----------|---------|
   | `DATABASE_URL` | _(from Railway Postgres)_ |
   | `NODE_ENV` | `production` |
   | `SESSION_SECRET` | _(long random string)_ |
   | `GOOGLE_CLIENT_ID` | |
   | `GOOGLE_CLIENT_SECRET` | |
   | `API_URL` | `https://your-app.up.railway.app` |
   | `CLIENT_URL` | `https://your-app.vercel.app` |

5. In Google Cloud Console, add redirect URI: `https://your-app.up.railway.app/auth/google/callback`
6. Verify: `GET https://your-app.up.railway.app/health`

### Frontend (Vercel)

1. Import the GitHub repo; set **Root Directory** to `client`.
2. Build command: `npm run build`. Output directory: `dist`.
3. Environment variable: `VITE_API_URL=https://your-app.up.railway.app` (no trailing slash).
4. Deploy. SPA routing is configured via `client/vercel.json`.
5. Update Railway `CLIENT_URL` to your Vercel URL if not set yet.

### Post-deploy checklist

- [ ] Google login works on the live URL
- [ ] Dashboard loads after login
- [ ] DevTools webhook changes XP / Gulag state
- [ ] Vault add/redeem works
- [ ] Season reset archives a season

## Project docs

- [PRD.md](PRD.md) — product requirements
- [cursor-prompts/](cursor-prompts/) — phased build prompts
