# PHASE 7 — Gulag UI
# Mode: Plan first, then Agent
# Exit criteria: Full ACTIVE → GULAG → REDEMPTION → ACTIVE loop works visually and functionally.

Read PRD.md in full before doing anything. It is the single source of truth. Do not contradict it.

---

Phase 6 is complete. We are building Phase 7 only. The Gulag state machine logic already exists in the backend (Phase 2). This phase is about making the full loop visible and correct in the UI.

## What to build

### 1. Verify backend Gulag loop (do not rewrite — just confirm)

Before touching the frontend, manually test the full loop via DevToolsPanel and Postman:
- [ ] Fire a DISCRETIONARY violation webhook → `users.state` becomes `'GULAG'`
- [ ] A `GULAG_REDEMPTION` quest row exists in the `quests` table with `streak_count = 0`
- [ ] Fire a DISCRETIONARY webhook while in GULAG → state stays `'GULAG'`, no XP change
- [ ] Manually simulate 3 consecutive zero-spend days:
  - Each day: no DISCRETIONARY transaction fires → quest `streak_count` increments by 1
  - After day 3: `users.state` becomes `'ACTIVE'`, quest `status` becomes `'COMPLETE'`

If any of these fail, fix the backend before touching the frontend. Do not paper over backend bugs with frontend workarounds.

### 2. Gulag state rendering in Dashboard

The dashboard already conditionally renders `GulagOverlay` — verify it does so correctly based on real `user.state` from the API.

Expand `GulagOverlay.tsx` to show:
- A clear "BATTLE PASS LOCKED" header
- The reason: "Violation detected. Complete your Redemption Quest to unlock."
- The active `GULAG_REDEMPTION` quest fetched from the dashboard endpoint
- Streak progress counter: `Day X of 3` — where X comes from `quest.streak_count` in the DB
- The XP bar must appear desaturated (greyscale filter via Tailwind) with a padlock icon overlay
- A "How to escape" section: plaintext explanation of the 3-day zero-spend requirement

### 3. Gulag streak progress — backend endpoint update

The `GET /api/user/:id/dashboard` endpoint must include the active `GULAG_REDEMPTION` quest (if one exists) in its response. If this is not already included, update the route to include it. The frontend should not need a separate fetch.

The quest object in the response must include `streak_count` so the frontend can render `Day X of 3`.

### 4. Streak increment logic

In the backend, define clearly how the streak increments:

- A "zero discretionary spend day" means: no `DISCRETIONARY` transaction with `is_violation = true` was logged for that calendar day (midnight to midnight, server timezone)
- When a day passes with no violation, `streak_count` on the active `GULAG_REDEMPTION` quest increments by 1
- At `streak_count = 3`: set `quest.status = 'COMPLETE'`, set `user.state = 'ACTIVE'`

For MVP: implement this check inside the webhook handler. When a non-violating DISCRETIONARY transaction is processed while the user is in GULAG, check if the current day's streak should advance. This avoids needing a cron job.

Add a `last_streak_date` column to the `quests` table (migration `007_quests_streak_date.sql`) to prevent the same day being counted twice:
```sql
ALTER TABLE quests ADD COLUMN last_streak_date DATE;
```

### 5. Toast notifications for Gulag events

Ensure these toasts fire at the right moments (wired in Phase 4 — verify they still work):
- On Gulag entry: `"Violation detected. Battle Pass frozen."`
- On streak day progress: `"Day X of 3 complete. Keep going."` (use real streak count)
- On Gulag exit: `"Redemption complete. Battle Pass unlocked."`

If any are missing or firing at wrong times, fix them now.

### 6. REDEMPTION state

The `REDEMPTION` state (user is mid-streak, between day 1 and day 3) must be visually distinct from full `GULAG`:
- Show the same GulagOverlay but with an amber badge instead of red
- Streak counter is more prominent: `"Day X of 3 — Keep going."`
- XP bar still desaturated, but padlock icon replaced with a progress/hourglass icon

## Rules
- Do not change the state machine logic — it is defined in PRD.md Section 5 and implemented in Phase 2.
- Do not add new pages.
- The streak must be server-side — never trust the client to advance a streak.

## Exit criteria — do not move to Phase 8 until all of these pass
- [ ] Firing a violation webhook transitions the UI to Gulag state immediately after dashboard refetch
- [ ] GulagOverlay renders with the correct quest and `streak_count = 0`
- [ ] Firing a non-violating webhook on a new day increments `streak_count` by 1 and updates the UI counter
- [ ] The same day cannot be counted twice (test by firing two non-violating webhooks on the same day)
- [ ] After 3 streak days: `user.state` returns to `'ACTIVE'`, XP bar un-desaturates, normal dashboard returns
- [ ] `REDEMPTION` state renders with amber badge and progress icon (not red padlock)
- [ ] All 3 Gulag toast messages fire at the correct moments
- [ ] Full loop can be completed end to end without any manual DB edits
