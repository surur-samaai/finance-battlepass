# Budgt Hero — PRD v2.0

> **This document supersedes PRD.md (v1.1) for all v2 features.**
> v1 phases are complete and should not be revisited. This PRD covers only what is new or changed in v2.
> The single source of truth for v1 mechanics (XP thresholds, state machine, game config) remains PRD.md unless explicitly overridden here.

---

## 1. What Changed & Why

### Problem with v1
The MVP proved the core mechanic works technically. It did not prove the app is something people want to open. Two structural problems:

1. **No reason to open the app on a good day.** The app only reacted to spending. Users who were being disciplined had nothing to interact with.
2. **No integrity in quest completion.** Manual quest completion meant users could lie for XP. This made the XP feel meaningless.

### v2 Thesis
Give users something to care about beyond their balance. The Budgteer character creates a daily check-in reason. The Stitch integration makes quest tracking automatic and trustworthy. The auth overhaul makes the app accessible to users without Google accounts.

---

## 2. Naming System (Final)

| v1 Name | v2 Name | Notes |
|---|---|---|
| Finance Battle Pass (app) | **Budgt Hero** | Brand name |
| Character | **Budgteer** | The user's personal avatar/character |
| Battle Pass | **Budgt Pass** | The seasonal progression system |
| Gulag | **Budgt Break** | Penalty state for overspending |
| Wishlist Tokens | **Coins** | Earned via XP/levels, spent on wishlist |
| Cosmetic Tokens | **Gems** | Earned separately, spent in character shop |
| Quests | **Quests** | Unchanged |
| Loadout | **Profile** | User configuration |
| Wishlist Vault | **The Shop** | Covers both wishlist and cosmetics |

> **Frontend only:** The Supabase project, GitHub repo, and DB column names retain v1 naming for now. Only frontend-facing copy and UI labels change. Flag any instance where a DB column name leaks into the UI and mask it at the API response layer.

---

## 3. Scope of v2

### In Scope
- Full app rebrand to Budgt Hero naming system
- Auth overhaul: email/password + Google OAuth + remember me + forgot/reset password
- Onboarding redesign: character creation + Stitch bank connection
- Budgteer character system with DiceBear avatar builder
- Stitch Open Banking integration for automatic transaction tracking
- Automatic quest completion (no more manual complete button)
- Gem economy + character cosmetics shop
- Coin economy refinement (renamed from Tokens)

### Out of Scope (v3+)
- Multi-user / household leaderboards
- Mobile app (React Native)
- Push notifications
- Custom quest creation by users
- Social sharing of Budgteer

---

## 4. Auth Overhaul

### 4.1 Supported Auth Methods
- Email + password (new)
- Google OAuth (existing — retain)
- Remember me (persistent session)
- Forgot password / reset password flow

### 4.2 Implementation: Switch from Passport.js to Supabase Auth

> **Do not extend the existing Passport.js setup.** Replace it entirely with Supabase Auth. Reasons:
> - Supabase Auth handles email/password, Google OAuth, password reset, and session persistence out of the box
> - Eliminates `connect-pg-simple` session table complexity
> - Auth state is managed client-side via Supabase JS client — no custom session middleware needed
> - The existing `sessions` table in the DB can be dropped

### 4.3 Auth Flow Changes

**Sign up (new user):**
1. User lands on `/` — sees Budgt Hero landing/login page
2. Can choose: "Sign up with email" or "Continue with Google"
3. Email signup: enter name, email, password → Supabase sends verification email → user verifies → redirected to onboarding
4. Google signup: OAuth flow → on first login, redirected to onboarding
5. Onboarding must be completed before accessing dashboard

**Sign in (returning user):**
1. User lands on `/` — sees sign in form
2. Email + password or Google
3. "Remember me" checkbox — if checked, session persists for 30 days
4. On success: skip onboarding, go directly to dashboard

**Forgot password:**
1. "Forgot password?" link on sign in form
2. User enters email → Supabase sends reset link
3. User clicks link → lands on `/reset-password` with token in URL
4. User enters new password → redirected to sign in

### 4.4 UI: Landing / Auth Page
- Clean, dark, branded to Budgt Hero
- Two clear CTAs: "Sign In" and "Create Account" — toggled on the same page, no separate routes
- Google OAuth button present on both
- "Remember me" on sign in only
- "Forgot password?" link on sign in only
- No explanatory copy about what the app does on this page — that comes during onboarding

---

## 5. Onboarding Redesign

The v1 onboarding (income → fixed costs → quests → wishlist) is replaced. The new onboarding has two distinct tracks running in parallel: financial setup and character creation.

### 5.1 Onboarding Steps

**Step 1 — Welcome**
- Single screen: "Let's set up your Budgt Hero."
- Two buttons: "Connect my bank" and "Skip for now (use manual mode)"
- Skip sends user to Step 3 with manual mode flagged on their profile

**Step 2 — Connect Bank (Stitch)**
- Render the Stitch Link UI (their hosted OAuth-style bank connection flow)
- On success: store the Stitch `accountId` and access token against the user
- On failure or skip: flag user as `bank_connected: false`, continue to Step 3

**Step 3 — Financial Profile**
- Monthly net income (number input)
- Fixed costs entry (same as v1 — add multiple line items)
- These are stored and used to calculate `playable_balance`

**Step 4 — Create Your Budgteer**
- User picks a display name for their Budgteer (not their Google/email name — a character name)
- DiceBear avatar builder: user selects style and customisation options
- Avatar config is stored as a JSON object (`avatar_config`) in the `users` table
- Preview of the chosen avatar renders in real time

**Step 5 — Ready**
- Summary screen showing: Budgteer name, avatar preview, playable balance
- "Start my Season" button → creates Season 1, sets state to `ACTIVE`, redirects to dashboard

### 5.2 Onboarding State
- Track onboarding completion in `users.onboarding_complete` (boolean)
- If `onboarding_complete = false` and user tries to access dashboard, redirect to onboarding
- Onboarding can only be completed once — returning users always go to dashboard

---

## 6. Budgteer Character System

### 6.1 Avatar: DiceBear
- Use the DiceBear API (`https://api.dicebear.com/9.x/`)
- Recommended style for this app: `adventurer` or `lorelei` — both support rich customisation
- Avatar config stored as JSON in `users.avatar_config`:
```typescript
interface AvatarConfig {
  style: string;        // e.g. "adventurer"
  seed: string;         // unique per user
  hair?: string;
  hairColor?: string;
  skinColor?: string;
  eyes?: string;
  accessories?: string[];
  backgroundColor?: string;
}
```
- To render the avatar anywhere: construct the DiceBear URL from the stored config
- Cosmetic upgrades (purchased with Gems) add new options to this config

### 6.2 Budgteer Display on Dashboard
- The dashboard greeting changes from a generic header to:
  - Budgteer avatar (rendered from DiceBear URL, medium size)
  - Budgteer name
  - Current level + XP bar beneath the avatar
  - A dynamic status line based on user state:
    - `ACTIVE`: "On track. Keep going."
    - `BUDGT_BREAK`: "You're on a Budgt Break. Complete your recovery quest."
    - `RECOVERY`: "Day X of 3. Almost there."

### 6.3 Gem Economy

Gems are earned separately from Coins and spent only in the character cosmetics section of The Shop.

**Earning Gems:**
| Action | Gems Earned |
|---|---|
| First bank connection | 50 Gems |
| Completing a Weekly Quest | 10 Gems |
| Completing a full season (Level 10) | 50 Gems |
| 7-day login streak | 15 Gems |

**Spending Gems — Cosmetic Shop:**
| Item Type | Gem Cost |
|---|---|
| New hair style | 20 Gems |
| Hair colour | 15 Gems |
| Accessory (glasses, hat, etc.) | 25 Gems |
| Background colour | 10 Gems |
| Avatar style change | 50 Gems |

> These costs are defaults. Store them in `gameConfig.ts` as a `GEM_SHOP_PRICES` constant, not inline.

### 6.4 DB Changes for Character System

New columns on `users` table (migration `008_character.sql`):
```sql
ALTER TABLE users
  ADD COLUMN budgteer_name VARCHAR(255),
  ADD COLUMN avatar_config JSONB,
  ADD COLUMN gems INTEGER DEFAULT 0,
  ADD COLUMN onboarding_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN bank_connected BOOLEAN DEFAULT FALSE,
  ADD COLUMN login_streak INTEGER DEFAULT 0,
  ADD COLUMN last_login_date DATE;
```

New table for cosmetic shop items (migration `009_shop_items.sql`):
```sql
CREATE TABLE shop_items (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  item_type    VARCHAR(50) NOT NULL,   -- 'hair', 'hair_color', 'accessory', 'background', 'style'
  gem_cost     INTEGER NOT NULL,
  avatar_key   VARCHAR(100) NOT NULL,  -- the DiceBear config key this item maps to
  avatar_value VARCHAR(100) NOT NULL,  -- the value to set in avatar_config
  is_default   BOOLEAN DEFAULT FALSE   -- default items are unlocked for all users
);

CREATE TABLE user_shop_items (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id),
  shop_item_id INTEGER REFERENCES shop_items(id),
  purchased_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. Stitch Open Banking Integration

### 7.1 What Stitch Does
Stitch is a South African Open Banking API. It allows users to connect their bank account (FNB, Nedbank, Standard Bank, Absa, Capitec) and gives the app read-only access to their transaction history and account balance.

### 7.2 Stitch Account Setup
- Sign up at stitch.money and apply for sandbox access
- You will receive a `client_id` and `client_secret`
- Store these as `STITCH_CLIENT_ID` and `STITCH_CLIENT_SECRET` in `.env`
- Stitch uses OAuth 2.0 — users authenticate directly with their bank via Stitch's hosted UI

### 7.3 Integration Architecture

```
User connects bank (onboarding Step 2)
        │
        ▼
Stitch Link UI (hosted by Stitch — you redirect to it)
        │
        ▼
Stitch returns auth code to your callback URL
        │
        ▼
Backend exchanges code for access_token + refresh_token
        │
        ▼
Store tokens in new `bank_connections` table
        │
        ▼
Webhook: Stitch calls POST /api/stitch/webhook when new transaction occurs
        │
        ▼
Backend processes transaction through Game Logic Engine (same as mock webhook)
```

### 7.4 New DB Table: `bank_connections` (migration `010_bank_connections.sql`)
```sql
CREATE TABLE bank_connections (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id) UNIQUE,
  stitch_account_id  VARCHAR(255),
  access_token   TEXT,
  refresh_token  TEXT,
  token_expires_at   TIMESTAMP,
  connected_at   TIMESTAMP DEFAULT NOW()
);
```

> **Security:** Never expose `access_token` or `refresh_token` in any API response. These are backend-only.

### 7.5 New API Endpoints for Stitch

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/stitch/connect` | Initiates Stitch Link flow — redirects user to Stitch OAuth |
| GET | `/api/stitch/callback` | Receives auth code from Stitch, exchanges for tokens, stores in DB |
| POST | `/api/stitch/webhook` | Receives real-time transaction events from Stitch |
| GET | `/api/user/:id/bank-status` | Returns `{ connected: boolean, accountName?: string }` |
| POST | `/api/stitch/refresh` | Refreshes expired Stitch access token (called internally, not by user) |

### 7.6 Transaction Processing
When Stitch sends a webhook:
1. Validate the webhook signature (Stitch provides a signing secret — store as `STITCH_WEBHOOK_SECRET`)
2. Parse the transaction payload
3. Map Stitch's transaction categories to your `system_category` values (`FIXED_BILL` | `DISCRETIONARY`)
4. Pass through the existing `gameLogicEngine.ts` — no changes to the engine itself
5. The mock bank webhook (`POST /api/webhooks/mock-bank`) remains for dev/testing purposes

### 7.7 Category Mapping
Stitch returns a transaction `type` and `merchant_category_code`. Define a mapping in `gameConfig.ts`:
```typescript
export const STITCH_CATEGORY_MAP: Record<string, 'FIXED_BILL' | 'DISCRETIONARY'> = {
  'utilities': 'FIXED_BILL',
  'rent': 'FIXED_BILL',
  'insurance': 'FIXED_BILL',
  'medical': 'FIXED_BILL',
  'groceries': 'DISCRETIONARY',
  'restaurants': 'DISCRETIONARY',
  'entertainment': 'DISCRETIONARY',
  'shopping': 'DISCRETIONARY',
  // extend as needed
};
```

### 7.8 Automatic Quest Tracking
With real transaction data, manual quest completion is removed for transaction-based quests.

| Quest Type | How It Now Completes |
|---|---|
| Zero Spend Day | Automatically at midnight if no `DISCRETIONARY` transactions that day |
| Under Budget Day | Automatically at midnight if total discretionary spend < daily limit |
| Weekly Streak | Automatically when 5+ Zero Spend Days recorded in the week |
| Budgt Break Recovery | Automatically after 3 consecutive days with no violating transactions |

> **Non-transaction quests** (e.g. Meal Prep, manual check-ins) retain the manual complete button — these cannot be automatically tracked without the bank connection. For users without a bank connection (manual mode), all quests retain the manual complete button.

**Midnight job:** Add a daily cron job (`node-cron`) that runs at 00:01 to:
1. Evaluate previous day's transactions for each user
2. Mark qualifying quests as complete and award XP
3. Advance Budgt Break streak counts where applicable
4. Check and award 7-day login streak Gems

---

## 8. The Shop (Redesign)

The v1 Wishlist Vault becomes The Shop, which now has two tabs:

### Tab 1 — Wishlist (Coins)
Same mechanic as v1. Renamed:
- "Wishlist" → "Wishlist"
- "Tokens" → "Coins"
- Items still carry over between seasons

### Tab 2 — Budgteer Shop (Gems)
- Grid of cosmetic items purchasable with Gems
- Items the user already owns: shown as "Equipped" or "Owned"
- Items they can afford: active Buy button showing Gem cost
- Items they cannot afford: locked, shows Gem deficit
- Purchasing an item: updates `users.avatar_config` with the new value and re-renders the avatar on dashboard

---

## 9. Updated API Endpoints (additions to v1)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/user/:id/character` | Returns `budgteer_name`, `avatar_config`, `gems`, `login_streak` |
| PUT | `/api/user/:id/character` | Updates `budgteer_name` or `avatar_config` |
| GET | `/api/shop/items` | Returns all shop items with ownership status for this user |
| POST | `/api/shop/items/:itemId/buy` | Purchases a cosmetic item with Gems |
| POST | `/api/user/:id/onboarding/complete` | Marks onboarding as complete, creates Season 1 |

---

## 10. Updated Build Order (v2 Phases)

> v1 Phases 1–9 are complete. v2 starts at Phase 10.

| Phase | What to Build | Key Exit Criteria |
|---|---|---|
| 10 — Rebrand | Rename all frontend copy, labels, and routes to v2 naming. No logic changes. | Zero v1 names visible in the UI. DB column names unchanged. |
| 11 — Auth Overhaul | Replace Passport.js with Supabase Auth. Email/password + Google + remember me + reset flow. | All auth methods work. Existing user data preserved. |
| 12 — Onboarding Redesign | New 5-step onboarding. Character creation. Stitch connect placeholder. | New users complete onboarding before reaching dashboard. |
| 13 — Budgteer Character | DiceBear avatar on dashboard. Gem economy. Character DB columns. | Avatar renders on dashboard. Gems awarded for weekly quest completion. |
| 14 — Stitch Integration | Stitch OAuth flow. Webhook handler. Automatic quest tracking. Midnight cron job. | Real bank transaction triggers game logic. Zero Spend Day auto-completes. |
| 15 — The Shop v2 | Add Budgteer Shop tab. Cosmetic items. Gem purchase flow. Avatar updates on buy. | Can earn Gems, browse shop, buy cosmetic, see avatar update. |
| 16 — Polish & Redeploy | Update README, redeploy to Railway + Vercel, full end-to-end test on live URL. | Live app reflects all v2 changes. Shareable portfolio URL. |

---

## 11. Updated gameConfig.ts Additions

Add the following to the existing `gameConfig.ts`:

```typescript
// Gem earning rules
export const GEM_REWARDS = {
  BANK_CONNECTION: 50,
  WEEKLY_QUEST_COMPLETE: 10,
  SEASON_COMPLETE: 50,
  LOGIN_STREAK_7_DAY: 15,
} as const;

// Gem shop prices
export const GEM_SHOP_PRICES = {
  HAIR_STYLE: 20,
  HAIR_COLOR: 15,
  ACCESSORY: 25,
  BACKGROUND_COLOR: 10,
  AVATAR_STYLE: 50,
} as const;

// Stitch category mapping
export const STITCH_CATEGORY_MAP: Record<string, 'FIXED_BILL' | 'DISCRETIONARY'> = {
  utilities: 'FIXED_BILL',
  rent: 'FIXED_BILL',
  insurance: 'FIXED_BILL',
  medical: 'FIXED_BILL',
  groceries: 'DISCRETIONARY',
  restaurants: 'DISCRETIONARY',
  entertainment: 'DISCRETIONARY',
  shopping: 'DISCRETIONARY',
};

// Login streak milestone
export const LOGIN_STREAK_GEM_MILESTONE = 7;
```

---

## 12. Open Questions & Deferred Decisions

| Question | Status | Notes |
|---|---|---|
| Which DiceBear style to use? | Open | `adventurer` recommended. Confirm during Phase 13. |
| Stitch sandbox approval timeline | Dependency | Sign up immediately. Build Phase 14 against sandbox first, switch to production before deploy. |
| Manual mode quest integrity | Deferred | Users without bank connection can still manually complete quests. Accept this limitation for v2 — integrity enforcement requires bank connection. |
| Login streak tracking | Open | Track via `last_login_date` on `users`. Increment `login_streak` on each daily login. Reset to 0 if a day is missed. Implement in auth middleware. |
| Cron job hosting | Open | `node-cron` works locally. On Railway, confirm cron jobs are supported in the free tier — if not, use a Railway cron service or a lightweight external trigger. |
| Cosmetic items seeding | Open | The `shop_items` table needs seed data before Phase 15. Write a `seed_shop_items.sql` file during Phase 13. |
