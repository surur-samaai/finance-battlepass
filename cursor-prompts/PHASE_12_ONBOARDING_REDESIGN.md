# PHASE 12 — Onboarding Redesign
# Mode: Plan first, then Agent
# Exit criteria: New users complete 5-step onboarding before reaching dashboard. Bank connect is a placeholder (Stitch comes in Phase 14).

Read PRD_v2.md Section 5 before doing anything. It defines every onboarding step precisely.

---

Phase 11 is complete. We are rebuilding the onboarding flow. The v1 onboarding is fully replaced.

## Context
- Onboarding only runs once per user — gated by `users.onboarding_complete`
- If `onboarding_complete = false` and user tries to access any protected route, redirect to `/onboarding`
- The Stitch bank connection (Step 2) is a placeholder in this phase — build the UI shell and the skip flow, but do not wire Stitch yet. That is Phase 14.
- Character creation (Step 4) is a placeholder in this phase — build the name input and a static avatar preview. DiceBear wiring comes in Phase 13.

---

## What to build

### 1. DB migrations

Run migration `008_character.sql` (from PRD_v2.md Section 6.4):
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

### 2. Onboarding gate

In `client/src/App.tsx` (or your router setup):
- After auth check, fetch `GET /api/user/:id/dashboard` which now returns `onboarding_complete`
- If `onboarding_complete === false`: redirect to `/onboarding`
- If `onboarding_complete === true`: proceed to `/dashboard`
- Show a loading state while this check is in flight — do not flash the dashboard or onboarding briefly

Update `GET /api/user/:id/dashboard` to include `onboarding_complete` in its response.

### 3. Onboarding page — `client/src/pages/Onboarding.tsx`

A single page with an internal step counter (1–5). Use a step indicator at the top (dots or numbered steps). Each step occupies the full viewport — no scrolling between steps.

**Step 1 — Welcome**
- Heading: "Welcome to Budgt Hero."
- Subtext: "Let's get you set up. This takes about 2 minutes."
- Single "Let's go" button → advances to Step 2
- No back button on Step 1

**Step 2 — Connect Your Bank**
- Heading: "Connect your bank account."
- Subtext: "We use Stitch to securely read your transactions. Your credentials never touch our servers."
- Two buttons:
  - "Connect my bank" → for now, show a toast: "Bank connection coming soon. Using manual mode for now." and set `bank_connected = false`. Advance to Step 3.
  - "Skip for now — use manual mode" → set `bank_connected = false`. Advance to Step 3.
- Small text below: "Supported banks: FNB, Nedbank, Standard Bank, Absa, Capitec"

**Step 3 — Financial Profile**
- Heading: "Set up your budget."
- Monthly net income: number input (ZAR)
- Fixed costs: repeatable line item entry (label + amount). "Add another" button. Same UX as v1 onboarding.
- "Next" button → validates that income is a positive number. Shows inline error if not. Advances to Step 4.
- Back button → returns to Step 2

**Step 4 — Create Your Budgteer**
- Heading: "Create your Budgteer."
- Budgteer name input: text input, placeholder "Give your Budgteer a name"
- Avatar preview: show a static placeholder avatar image (a simple grey silhouette SVG is fine — DiceBear wiring is Phase 13)
- Small text: "You'll customise your avatar after setup."
- "Next" button → validates name is not empty. Advances to Step 5.
- Back button → returns to Step 3

**Step 5 — Ready**
- Heading: "You're ready."
- Show a summary card:
  - Budgteer name
  - Playable balance (income minus fixed costs, formatted as ZAR)
  - Bank status: "Manual mode" or "Bank connected" (based on Step 2 choice)
- "Start my Season" button → calls `POST /api/user/:id/onboarding/complete`. On success, redirect to `/dashboard`.
- No back button on Step 5

### 4. Backend: `POST /api/user/:id/onboarding/complete`

Replace the stub with real logic:
1. Save `budgteer_name`, `playable_balance` (income minus fixed costs), `bank_connected` to `users`
2. Set `onboarding_complete = true`
3. Create Season 1 row in `seasons` table (`season_number = 1`, `start_date = NOW()`)
4. Set `users.current_season_id` to the new season ID
5. Generate the default quest set for the user (same logic as the season reset service from Phase 8, extracted into a shared `generateDefaultQuests(userId)` helper)
6. Return `{ success: true }`

All of the above in a single DB transaction.

### 5. Extract `generateDefaultQuests` helper

The season reset service (Phase 8) already generates default quests. Extract this logic into a shared helper function `server/src/services/questService.ts` so both the season reset and onboarding can call it without duplicating code.

## Rules
- Do not wire Stitch in this phase. The "Connect my bank" button shows a toast and moves on.
- Do not wire DiceBear in this phase. Use a static placeholder avatar.
- Do not change any v1 game logic.
- Onboarding state (current step) lives in React local state — do not persist it to the DB mid-flow. Only write to the DB on "Start my Season".

## Exit criteria — do not move to Phase 13 until all pass
- [ ] A new user who signs up is redirected to `/onboarding` before seeing the dashboard
- [ ] A returning user who completed onboarding is never shown onboarding again
- [ ] All 5 steps render correctly with forward and back navigation
- [ ] Step 3 validates that income is a positive number before advancing
- [ ] Step 4 validates that Budgteer name is not empty before advancing
- [ ] "Start my Season" saves all data and creates a Season 1 row in the DB
- [ ] After onboarding: `users.onboarding_complete = true`, `users.budgteer_name` is set, `users.playable_balance` is calculated correctly
- [ ] Default quests are generated for the user after onboarding completes
- [ ] Dashboard is reachable immediately after onboarding completes with no second redirect
