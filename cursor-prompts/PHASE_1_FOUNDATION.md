# PHASE 1 — Foundation
# Mode: Plan first, then Agent
# Exit criteria: All routes return stubs. /health returns 200. Migrations ready to run.

Read PRD.md in full before doing anything. It is the single source of truth. Do not contradict it.

---

We are building Phase 1 only. Do not build anything from later phases.

## What to build

1. Scaffold the folder structure exactly as defined in Section 12 of PRD.md. Backend only — do not touch `client/` yet.

2. Set up the Express + TypeScript server in `server/`:
   - `ts-node-dev` for local dev
   - `dotenv` for env vars
   - `pg` connection pool in `server/src/db/index.ts` — connection string from `DATABASE_URL` env var

3. Register every route from Section 8.4 of PRD.md. Each route returns a hardcoded stub:
   ```json
   { "status": "stub", "endpoint": "<route name>" }
   ```

4. Create `server/src/middleware/requireAuth.ts`:
   - Returns `401 { "error": "Unauthorized" }` if no session
   - Can be bypassed with `SKIP_AUTH=true` env var for local testing
   - Wire it to all `/api/*` routes

5. `/health` returns `{ "status": "ok" }` with no auth required.

6. Create SQL migration files in `server/db/migrations/` — one file per table:
   - `001_users.sql`
   - `002_seasons.sql`
   - `003_quests.sql`
   - `004_wishlist.sql`
   - `005_transactions.sql`
   - Use the exact schema from Section 8.2 of PRD.md. Do not add or change any columns.

7. Create `server/src/constants/gameConfig.ts` — export all values from Section 4 of PRD.md as named TypeScript constants:
   - XP level thresholds
   - Token types and rules
   - Quest XP values
   - Wishlist pricing tiers
   - No magic numbers anywhere else in the codebase. Always import from here.

8. Create `.env.example` at the project root with every required env var listed and commented.

## Rules
- Strict TypeScript throughout. Zero `any` types.
- No game logic this phase. Stubs only.
- No frontend this phase.
- Ask before adding any dependency not implied by Section 8.1 of PRD.md.

## Exit criteria — do not move to Phase 2 until all of these pass
- [ ] `npm run dev` starts the server without errors
- [ ] `GET /health` returns `{ "status": "ok" }`
- [ ] All `/api/*` routes return stub JSON (or 401 when `SKIP_AUTH` is not set)
- [ ] Migration files run against a local PostgreSQL DB and create all tables correctly
- [ ] `gameConfig.ts` exports all values from Section 4 with no magic numbers inline
