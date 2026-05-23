# Finance Battle Pass — PRD (MVP v1.1)

> **This file is the single source of truth for this project.**
> All game logic, DB schema, API contracts, and state transitions defined here must be implemented exactly as written. Do not deviate without updating this document first.

---

## 1. Product Overview

### Problem Statement
Traditional budgeting apps are backward-looking guilt calculators. They show you what you already spent, which changes nothing. They fail to intercept the user psychologically at the point of impulse — where decisions actually happen.

### Product Vision
A gamified, forward-looking financial dashboard that treats monthly budgeting as a Battle Pass. Users earn XP and Tokens through disciplined spending behaviour, then spend those Tokens to unlock guilt-free discretionary purchases from a personal Wishlist. Every month is a Season. Progress resets. The game continues.

---

## 2. Target Audience

- Young professionals and hybrid/WFH workers managing variable discretionary expenses (takeout, subscriptions, gaming, etc.).
- Users who experience budget fatigue and the **abstinence violation effect** — abandoning a budget entirely after a single slip.
- Portfolio demo audience: developers and hiring managers evaluating full-stack capability, game mechanic design, and UX thinking.

---

## 3. Scope

### Phase 1 (MVP) — In Scope
- Gamified UI: XP, Levels, Seasons (monthly resets).
- Customisable Quest Board: Daily and Weekly spending challenges.
- Wishlist Vault: Items converted to Token costs with a 2-step redemption flow.
- The Gulag: Penalty system with a defined state machine for off-budget spending.
- Mock Bank Webhook: Simulated card swipe UI for manual transaction testing.
- Auth: Google OAuth (single user scope for MVP).

### Phase 2+ — Out of Scope
- Live Open Banking API integration (Stitch / Ozow).
- Multi-user / household leaderboards.
- Mobile app deployment (React Native).
- Push notifications.

---

## 4. Game Design Ruleset

> This section is the authoritative source of truth for all game mechanics. Every value here must be reflected exactly in backend logic. Do not hardcode these values inline — store them in a `constants/gameConfig.ts` file and import from there.

### 4.1 XP & Levels

| Level | XP Required (Cumulative) | Reward on Reaching Level |
|-------|--------------------------|--------------------------|
| 1 | 0 (start) | — |
| 2 | 100 XP | — |
| 3 | 250 XP | — |
| 4 | 450 XP | — |
| 5 | 700 XP | 1 Micro-Token |
| 6 | 1,000 XP | — |
| 7 | 1,350 XP | — |
| 8 | 1,750 XP | — |
| 9 | 2,200 XP | — |
| 10 | 2,700 XP | 1 Standard Token |
| Season Max | 2,700 XP | Season resets; Wishlist carries over |

> **Design Note:** A disciplined user should reach Level 10 in approximately 3 weeks, leaving the final week as a reward window. Tune these values after your first end-to-end playtest.

### 4.2 Token Types

| Token Type | How Earned | Redeemable For |
|------------|------------|----------------|
| Micro-Token | Reaching Level 5 | Small guilt-free purchases (coffee, single snack). Wishlist items priced at 1 Micro-Token. |
| Standard Token | Reaching Level 10 | Mid-tier Wishlist items. Priced at 1–3 Standard Tokens depending on real-world cost. |

### 4.3 Quest XP Values

| Quest Type | Example | XP Reward | Reset Cadence |
|------------|---------|-----------|---------------|
| Zero Spend Day | No discretionary spending today | 25 XP | Daily |
| Under Budget Day | Spend under daily discretionary limit | 15 XP | Daily |
| Meal Prep | Manual check-in: cooked at home | 20 XP | Daily |
| Weekly Streak | 5+ Zero Spend Days in a week | 100 XP | Weekly |
| Weekly Under Budget | All 7 days under daily limit | 75 XP | Weekly |
| Gulag Redemption | 3 consecutive days zero discretionary | 50 XP + Gulag Exit | One-time per Gulag |

### 4.4 Wishlist Token Pricing Formula

Use this formula to suggest a Token cost when a user adds a Wishlist item. The user can override it. Store the final `token_cost` in the DB — not the formula.

| Real-World Price (ZAR) | Token Cost |
|------------------------|------------|
| Under R50 | 1 Micro-Token |
| R50 – R150 | 1 Standard Token |
| R150 – R400 | 2 Standard Tokens |
| R400 – R800 | 3 Standard Tokens |
| Over R800 | Manually set by user on creation |

---

## 5. User State Machine

> The user account exists in exactly one of three states at any time. All business logic keys off this state. The state is stored in `users.state` as a string enum.

```
ACTIVE ──(violation)──► GULAG ──(quest generated)──► REDEMPTION ──(streak complete)──► ACTIVE
```

| State | Description | Can Earn XP? | Transition Out |
|-------|-------------|--------------|----------------|
| `ACTIVE` | Normal play. Quests available. XP accumulates. | Yes | Impulse violation → `GULAG` |
| `GULAG` | Battle Pass frozen. No XP. Redemption Quest auto-generated. | No | Quest generated → `REDEMPTION` |
| `REDEMPTION` | 3-day zero-spend streak in progress. XP frozen. | No | Streak complete → `ACTIVE` |

> **Critical Rule:** Entering GULAG does **not** reset XP or Level. It only freezes accumulation. A user at Level 8 who enters GULAG returns to Level 8 on exit. The Gulag is a pause, not a wipe — this is intentional to prevent the abstinence violation effect.

---

## 6. Core User Flows

### Flow 1: Onboarding & Season Initialisation
1. User authenticates via Google OAuth.
2. User enters monthly net income.
3. User inputs fixed costs (rent, medical aid, savings). These are locked and hidden from the playable balance immediately.
4. User configures their Loadout: selects which quest types to activate.
5. User populates their Wishlist with items and real-world prices. Token costs are suggested by formula; user can override.
6. Season begins. User state set to `ACTIVE`. XP = 0, Level = 1.

### Flow 2: Happy Path (Earning Rewards)
1. User completes a Daily Quest (e.g. Zero Spend Day).
2. System awards XP. Toast notification fires.
3. XP progress bar fills on dashboard.
4. On hitting Level 5 or Level 10 threshold: Token awarded. Toast fires.
5. User navigates to Vault, selects a Wishlist item, initiates 2-step redemption confirm.
6. On confirmation: `token_cost` deducted, `is_purchased` set to `true`, item glows in Vault.

### Flow 3: Gulag Path (Impulse Violation)
1. User fires mock bank webhook (via internal Dev Tools UI).
2. Backend Game Logic Engine parses payload.
3. Violation detected: off-budget discretionary spend.
4. Balance deducted. User state set to `GULAG`. Battle Pass frozen.
5. Gulag Redemption Quest auto-generated in `quests` table.
6. Dashboard shows Gulag state: locked XP bar, redemption quest visible, streak counter (0/3 days).
7. User completes 3 consecutive zero-spend days → state transitions `REDEMPTION` → `ACTIVE`.
8. XP accumulation resumes from where it was frozen.

### Flow 4: Season Reset (End of Month)
1. Manual trigger hits `/api/admin/reset-season`.
2. XP and Level reset to 0 / Level 1.
3. Tokens reset to 0.
4. Active quests regenerated for new season.
5. Wishlist items carry over. `is_purchased` flags reset to `false`.
6. Previous season stats archived in `seasons` table.

---

## 7. Authentication

**Approach:** Google OAuth 2.0 via Passport.js

- Use `passport-google-oauth20` strategy.
- Store session in PostgreSQL using `connect-pg-simple`.
- On first login, auto-create a user record in the `users` table.
- All `/api/*` routes must be behind a `requireAuth` middleware. Only `/auth/*` and `/health` are public.

---

## 8. Technical Architecture

### 8.1 Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React (Vite) + TypeScript + Tailwind CSS | SPA. Dark mode only. |
| Backend | Node.js + Express (TypeScript) | REST API. Strict TypeScript types throughout. |
| Database | PostgreSQL | Local for dev; Railway or Supabase for deploy. |
| Auth | Passport.js + Google OAuth 2.0 | Session-based. `connect-pg-simple` for session store. |
| Dev Tool | Cursor | Strict TypeScript to reduce AI hallucination risk. |

### 8.2 Database Schema

> All tables must be created via SQL migration files in `/db/migrations/`. Never modify schema by hand in production.

#### `users`
```sql
CREATE TABLE users (
  id                        SERIAL PRIMARY KEY,
  google_id                 VARCHAR(255) UNIQUE NOT NULL,
  username                  VARCHAR(255) NOT NULL,
  email                     VARCHAR(255) UNIQUE NOT NULL,
  playable_balance          NUMERIC(10,2) DEFAULT 0,
  current_xp                INTEGER DEFAULT 0,
  level                     INTEGER DEFAULT 1,
  wishlist_tokens_micro     INTEGER DEFAULT 0,
  wishlist_tokens_standard  INTEGER DEFAULT 0,
  state                     VARCHAR(20) DEFAULT 'ACTIVE' CHECK (state IN ('ACTIVE','GULAG','REDEMPTION')),
  current_season_id         INTEGER,
  created_at                TIMESTAMP DEFAULT NOW()
);
```

#### `seasons`
```sql
CREATE TABLE seasons (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id),
  season_number  INTEGER NOT NULL,
  start_date     DATE NOT NULL,
  end_date       DATE,
  final_xp       INTEGER,
  final_level    INTEGER,
  final_tokens   INTEGER
);
```

#### `quests`
```sql
CREATE TABLE quests (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  title         VARCHAR(255) NOT NULL,
  xp_reward     INTEGER NOT NULL,
  quest_type    VARCHAR(30) CHECK (quest_type IN ('DAILY','WEEKLY','GULAG_REDEMPTION')),
  status        VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','COMPLETE','FAILED')),
  streak_count  INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);
```

#### `wishlist`
```sql
CREATE TABLE wishlist (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id),
  item_name    VARCHAR(255) NOT NULL,
  price_zar    NUMERIC(10,2),
  token_cost   INTEGER NOT NULL,
  token_type   VARCHAR(10) CHECK (token_type IN ('MICRO','STANDARD')),
  is_purchased BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP DEFAULT NOW()
);
```

#### `transactions`
```sql
CREATE TABLE transactions (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER REFERENCES users(id),
  amount           NUMERIC(10,2) NOT NULL,
  merchant         VARCHAR(255),
  system_category  VARCHAR(20) CHECK (system_category IN ('FIXED_BILL','DISCRETIONARY')),
  is_violation     BOOLEAN DEFAULT FALSE,
  processed_at     TIMESTAMP DEFAULT NOW()
);
```

### 8.3 Mock Bank Webhook Payload Schema

```typescript
interface BankWebhookPayload {
  user_id: number;
  amount: number;           // ZAR, positive
  merchant: string;         // e.g. "Nando's Rondebosch"
  system_category: 'FIXED_BILL' | 'DISCRETIONARY';
  timestamp: string;        // ISO 8601
}
```

### 8.4 API Endpoints

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| GET | `/health` | No | Returns 200 OK. Use for deployment health checks. |
| GET | `/auth/google` | No | Initiates Google OAuth flow. |
| GET | `/auth/google/callback` | No | OAuth callback. Creates user on first login. |
| GET | `/auth/logout` | No | Destroys session. |
| GET | `/api/user/:id/dashboard` | Yes | Fetches state: balance, XP, Level, state, active quests. |
| GET | `/api/user/:id/wishlist` | Yes | Fetches wishlist items and current token counts. |
| POST | `/api/user/:id/quests/:questId/complete` | Yes | Manual trigger for non-transaction quests (e.g. Meal Prepped). |
| POST | `/api/user/:id/wishlist/:itemId/redeem` | Yes | Step 1 of redemption: validates tokens available. |
| POST | `/api/user/:id/wishlist/:itemId/confirm-redeem` | Yes | Step 2 of redemption: deducts tokens, marks purchased. |
| POST | `/api/webhooks/mock-bank` | Yes | Simulates card swipe. Triggers Game Logic Engine. |
| POST | `/api/admin/reset-season` | Yes | Manually triggers end-of-season reset. |

---

## 9. Game Logic Engine

> Implemented as a standalone TypeScript module: `src/services/gameLogicEngine.ts`. Never put this logic inline in a route handler. It must be independently testable.

### Processing Flow

```
Receive POST /api/webhooks/mock-bank
        │
        ▼
Validate payload shape (400 if invalid)
        │
        ▼
system_category === 'FIXED_BILL'?
  YES → Deduct balance, log transaction, return. No game logic.
  NO  ↓
        ▼
user.state === 'GULAG'?
  YES → Deduct balance, log with is_violation=true, return.
  NO  ↓
        ▼
Is transaction a violation of active quests?
  NO  → Deduct balance, maintain streaks, award XP if quest criteria met.
  YES → Deduct balance
         Set user.state = 'GULAG'
         Auto-generate GULAG_REDEMPTION quest (streak_count = 0)
         Log transaction with is_violation = true
        │
        ▼
Recalculate XP total
Check level thresholds (see Section 4.1)
If level-up: increment level, award token if applicable
        │
        ▼
Save ALL state changes in a single DB transaction.
Never partial-save. All or nothing.
```

---

## 10. UI / UX Requirements

### Design Language
- **Dark mode only.** No light mode toggle for MVP.
- **Reference aesthetic:** Valorant Battle Pass UI. High contrast, neon accents on near-black background.
- **Primary accent:** Electric blue `#4A90D9` or neon cyan `#00D4FF`. Pick one, lock it in.
- **Typography:** Inter or JetBrains Mono.
- **Rule:** Do not spend more than 2 days on visual polish. Functionality first.

### Dashboard (Primary View)
- XP progress bar: prominent, animated fill. Shows `current_xp / xp_to_next_level`.
- Current Level: large and readable.
- Playable Balance: displayed prominently. **Total balance is never shown.**
- User State badge: `ACTIVE` (green) | `GULAG` (red, pulsing) | `REDEMPTION` (amber).
- Active quests: listed below fold. Each shows title, XP reward, and completion button for manual quests.
- Token count: in header or sidebar. Micro-Tokens and Standard Tokens displayed separately.

### Wishlist Vault
- Grid layout.
- **Affordable items:** glowing border, active Redeem button.
- **Locked items:** greyed out, lock icon, shows token deficit.
- **Redeemed items:** stamped "UNLOCKED", de-emphasised.
- **Redemption flow:** clicking Redeem opens a modal showing item name + token cost + Confirm button. Second click commits.

### Gulag State
- XP bar appears desaturated with a padlock icon.
- Redemption quest displayed prominently with streak counter (e.g. `Day 1 / 3`).

### Toast Notifications

| Trigger | Message |
|---------|---------|
| Quest completed | `+25 XP. Zero Spend Day complete.` |
| Level up | `LEVEL UP. You are now Level 5.` |
| Token awarded | `Micro-Token earned. Check your Vault.` |
| Gulag triggered | `Violation detected. Battle Pass frozen.` |
| Gulag day progress | `Day 2 of 3 complete. One more.` |
| Gulag exit | `Redemption complete. Battle Pass unlocked.` |
| Wishlist redeemed | `Unlocked: [Item Name]. Go get it.` |

---

## 11. Recommended Build Order

Build in this sequence. Do not skip ahead. The goal is to have a working core loop (webhook → DB state change) before touching auth or UI.

| Phase | What to Build | Exit Criteria Before Moving On |
|-------|---------------|-------------------------------|
| 1 — Foundation | DB schema (migration files), Express server skeleton, all routes returning stub JSON, `/health` endpoint. | Postman can hit all endpoints and receive valid stub responses. |
| 2 — Core Loop | `gameLogicEngine.ts`, mock webhook handler, real DB writes. | Firing webhook via Postman changes `users.state`, `current_xp`, and logs a `transaction` row correctly. |
| 3 — Frontend Shell | React app, dashboard layout (dark mode, Tailwind), hardcoded fake data. No API calls yet. | Dashboard renders correctly with static data in-browser. |
| 4 — Wire Up | Connect frontend to API. Replace hardcoded data with real fetch/axios calls. | Dashboard reflects real DB state after a webhook fires. |
| 5 — Auth | Google OAuth, session middleware, `requireAuth` guard on all `/api/*` routes. | App requires login. Unauthenticated requests to `/api/*` return 401. |
| 6 — Vault & Wishlist | Wishlist UI, add item flow, 2-step redemption modal. | Can add a wishlist item, earn tokens, and redeem end-to-end. |
| 7 — Gulag UI | Gulag state rendering, locked XP bar, streak counter, toast notifications. | Full `ACTIVE → GULAG → REDEMPTION → ACTIVE` loop works visually. |
| 8 — Season Reset | Manual reset endpoint, season archive logic. | Triggering reset archives season, resets XP/tokens, preserves wishlist. |
| 9 — Polish & Deploy | Animations, responsive layout, deploy to Railway/Vercel. | App live on a public URL. Shareable in portfolio. |

---

## 12. Project Structure

```
finance-battle-pass/
├── PRD.md                          ← this file
├── server/
│   ├── src/
│   │   ├── index.ts                ← Express app entry
│   │   ├── constants/
│   │   │   └── gameConfig.ts       ← XP thresholds, token rules (from Section 4)
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── user.ts
│   │   │   ├── wishlist.ts
│   │   │   ├── quests.ts
│   │   │   ├── webhooks.ts
│   │   │   └── admin.ts
│   │   ├── services/
│   │   │   └── gameLogicEngine.ts  ← core game logic, never inline in routes
│   │   ├── middleware/
│   │   │   └── requireAuth.ts
│   │   └── db/
│   │       └── index.ts            ← pg pool setup
│   ├── db/
│   │   └── migrations/             ← SQL migration files
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Vault.tsx
│   │   │   └── Onboarding.tsx
│   │   ├── components/
│   │   │   ├── XPBar.tsx
│   │   │   ├── QuestCard.tsx
│   │   │   ├── WishlistItem.tsx
│   │   │   ├── GulagOverlay.tsx
│   │   │   ├── RedemptionModal.tsx
│   │   │   └── DevToolsPanel.tsx   ← mock webhook firing UI
│   │   └── hooks/
│   │       └── useDashboard.ts
│   ├── index.html
│   └── vite.config.ts
└── package.json
```

---

## 13. Open Questions & Deferred Decisions

| Question | Status | Notes |
|----------|--------|-------|
| How are `FIXED_BILL` transactions categorised? | Open | For MVP: user manually sets `system_category` when firing the mock webhook. No auto-categorisation. |
| Can a user manually complete a `GULAG_REDEMPTION` quest? | Decided | No. The streak must be earned via webhook. Disallow manual completion of `GULAG_REDEMPTION` quest type in the backend. |
| Should the Vault show purchase history? | Deferred | Phase 2 feature. Out of MVP scope. |
| Season reset: manual or automated? | Decided | Manual trigger via `/api/admin/reset-season` for MVP. Automate with a cron job in Phase 2. |
