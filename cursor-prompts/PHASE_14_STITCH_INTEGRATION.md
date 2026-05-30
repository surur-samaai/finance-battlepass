# PHASE 14 — Stitch Open Banking Integration
# Mode: Plan first, then Agent
# Exit criteria: Real bank transactions trigger game logic. Automatic quest tracking works.

Read PRD_v2.md Section 7 in full before doing anything. It defines the entire Stitch architecture.

---

Phase 13 is complete. This is the most complex phase in v2. Take it in order. Do not skip ahead within this phase.

## Prerequisites — confirm all before starting
- [ ] Stitch sandbox account created at stitch.money
- [ ] Stitch `client_id` and `client_secret` received and added to `server/.env`
- [ ] Stitch webhook secret added to `server/.env` as `STITCH_WEBHOOK_SECRET`
- [ ] Stitch sandbox callback URL configured in Stitch dashboard: `http://localhost:3000/api/stitch/callback`
- [ ] Stitch webhook URL configured in Stitch dashboard: `http://localhost:3000/api/stitch/webhook` (use ngrok for local testing)

---

## Part 1 — Bank Connection Flow

### 1. DB migration
Run `010_bank_connections.sql` (from PRD_v2.md Section 7.4):
```sql
CREATE TABLE bank_connections (
  id                 SERIAL PRIMARY KEY,
  user_id            INTEGER REFERENCES users(id) UNIQUE,
  stitch_account_id  VARCHAR(255),
  access_token       TEXT,
  refresh_token      TEXT,
  token_expires_at   TIMESTAMP,
  connected_at       TIMESTAMP DEFAULT NOW()
);
```

### 2. `server/src/services/stitchService.ts`

All Stitch API calls live here. No Stitch logic in route handlers. Create the following functions:

```typescript
// Exchange auth code for access + refresh tokens
export async function exchangeCodeForTokens(code: string): Promise<StitchTokens>

// Refresh an expired access token
export async function refreshAccessToken(refreshToken: string): Promise<StitchTokens>

// Fetch recent transactions for an account
export async function fetchTransactions(accessToken: string, accountId: string): Promise<StitchTransaction[]>

// Validate an incoming webhook signature
export async function validateWebhookSignature(payload: string, signature: string): Promise<boolean>
```

Define the types:
```typescript
interface StitchTokens {
  access_token: string
  refresh_token: string
  expires_in: number  // seconds
}

interface StitchTransaction {
  id: string
  amount: number
  merchant: string
  category: string   // Stitch's category string
  date: string       // ISO 8601
}
```

### 3. Stitch OAuth routes — `server/src/routes/stitch.ts`

`GET /api/stitch/connect`:
- Constructs the Stitch Link OAuth URL with your `client_id`, scopes (`transactions`, `accounts`), and redirect URI
- Redirects the user to Stitch's hosted auth UI
- Store a `state` parameter (random UUID) in the user's session to prevent CSRF

`GET /api/stitch/callback`:
- Validates the `state` parameter matches what was stored
- Exchanges the `code` for tokens via `stitchService.exchangeCodeForTokens()`
- Stores tokens in `bank_connections` table
- Sets `users.bank_connected = true`
- Awards 50 Gems via `characterService.awardGems()` (the "first bank connection" reward)
- Redirects to `/dashboard`

`GET /api/user/:id/bank-status`:
- Returns `{ connected: boolean, connectedAt?: string }`

### 4. Wire Stitch connect to onboarding Step 2
Replace the placeholder toast in `Onboarding.tsx` Step 2:
- "Connect my bank" button calls `GET /api/stitch/connect` (redirect)
- After the OAuth flow completes, Stitch redirects back to your callback, which then redirects to `/dashboard`
- Handle the case where the user is mid-onboarding: after the Stitch callback, if `onboarding_complete = false`, redirect to `/onboarding` at Step 3 instead of `/dashboard`
- "Skip for now" still sets `bank_connected = false` and advances to Step 3

---

## Part 2 — Webhook & Transaction Processing

### 5. Stitch webhook handler — `POST /api/stitch/webhook`

This route is NOT behind `requireAuth` — it's called by Stitch's servers, not the user's browser.

Handler logic:
1. Read the raw request body as a string (do not parse JSON before signature validation)
2. Call `stitchService.validateWebhookSignature(rawBody, req.headers['stitch-signature'])` — return 401 if invalid
3. Parse the JSON payload
4. Identify the `user_id` from the `stitch_account_id` in the payload (look up `bank_connections` table)
5. Map the Stitch transaction category to `FIXED_BILL | DISCRETIONARY` using `STITCH_CATEGORY_MAP` from `gameConfig.ts`
6. Build a `BankWebhookPayload` and pass it to `gameLogicEngine.processTransaction()` — the engine does not change
7. Return 200 to Stitch within 5 seconds (Stitch will retry if you don't respond quickly — do heavy processing asynchronously if needed)

### 6. Token refresh middleware
Before any call to `stitchService.fetchTransactions()`, check if the access token is expired (`token_expires_at < NOW()`). If so, call `stitchService.refreshAccessToken()` and update the `bank_connections` row. Create a helper `server/src/services/stitchService.ts`:
```typescript
export async function getValidAccessToken(userId: number): Promise<string>
```
This handles the refresh check internally.

---

## Part 3 — Automatic Quest Tracking

### 7. Remove manual complete button for bank-connected users
In `QuestCard.tsx`:
- If the user has `bank_connected = true`: hide the "Complete" button on all transaction-based quests (DAILY, WEEKLY)
- The "Complete" button remains for users with `bank_connected = false` (manual mode)
- `GULAG_REDEMPTION` quests (now called Budgt Break recovery quests) never show a manual complete button regardless of bank status

Update the `GET /api/user/:id/dashboard` response to include `bank_connected` so the frontend can conditionally render this.

### 8. Daily cron job — `server/src/jobs/dailyQuestEvaluator.ts`

Install `node-cron`. Create the cron job that runs at `00:01` every day:

```typescript
import cron from 'node-cron'
cron.schedule('1 0 * * *', async () => {
  await evaluateDailyQuests()
})
```

`evaluateDailyQuests()` logic (must be idempotent):
1. Fetch all users with `bank_connected = true` and `state != 'BUDGT_BREAK'`
2. For each user:
   - Fetch yesterday's transactions from the `transactions` table (already logged by the webhook)
   - If zero `DISCRETIONARY` transactions with `is_violation = false` yesterday → mark their Zero Spend Day quest `COMPLETE`, award 25 XP
   - If total discretionary spend yesterday < daily limit → mark Under Budget Day quest `COMPLETE`, award 15 XP
   - Check for weekly streak (5+ Zero Spend Days this week) → award 100 XP if met
3. For users in `RECOVERY` state:
   - If yesterday had no violating transactions: increment `quest.streak_count`
   - If `streak_count = 3`: set `user.state = 'ACTIVE'`, mark recovery quest `COMPLETE`
4. Log each evaluation run with a timestamp to `console.log` — include user ID and what was awarded

**Idempotency check:** Before awarding XP for a quest, verify the quest's `status` is still `ACTIVE`. Never award XP to a quest already marked `COMPLETE` or `FAILED`.

### 9. Dev-only manual trigger for cron
Add `POST /api/dev/run-daily-evaluator` (behind a `NODE_ENV === 'development'` check) that manually calls `evaluateDailyQuests()`. Use this to test the cron logic without waiting until midnight.

---

## Rules
- Never expose Stitch tokens in any API response.
- Always validate the Stitch webhook signature — never skip this check.
- The mock bank webhook (`POST /api/webhooks/mock-bank`) must remain functional for dev testing.
- `gameLogicEngine.ts` does not change. Stitch feeds into it, not around it.
- The cron job must be idempotent. Test this by running it twice manually and verifying no double-awards.

## Exit criteria — do not move to Phase 15 until all pass
- [ ] Clicking "Connect my bank" in onboarding redirects to Stitch's hosted UI
- [ ] Completing the Stitch flow stores tokens in `bank_connections` and sets `bank_connected = true`
- [ ] 50 Gems are awarded on first bank connection (verify in DB)
- [ ] `GET /api/user/:id/bank-status` returns `{ connected: true }` after connection
- [ ] A real Stitch sandbox transaction webhook triggers `gameLogicEngine.processTransaction()` and changes `users.current_xp` or `users.state`
- [ ] Webhook signature validation rejects requests with an invalid signature (test with a tampered payload)
- [ ] Manual quest complete button is hidden for bank-connected users on transaction-based quests
- [ ] Running the daily evaluator manually via `/api/dev/run-daily-evaluator` correctly marks Zero Spend Day quests complete for users with no transactions yesterday
- [ ] Running the evaluator twice in a row does not double-award XP
- [ ] Budgt Break recovery streak increments correctly via the nightly evaluator
- [ ] Token refresh works when `token_expires_at` is in the past (test by manually setting it to a past timestamp in DB)
