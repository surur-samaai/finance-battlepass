# PHASE 8 — Season Reset
# Mode: Plan first, then Agent
# Exit criteria: Triggering reset archives season, wipes XP/tokens, preserves wishlist.

Read PRD.md in full before doing anything. It is the single source of truth. Do not contradict it.

---

Phase 7 is complete. We are building Phase 8 only. This is a focused, contained phase — do not touch the UI beyond what is listed here.

## What to build

### 1. Season reset service — `server/src/services/seasonResetService.ts`

Create a standalone TypeScript function:
```typescript
export async function resetSeason(userId: number): Promise<SeasonResetResult>
```

This function must execute all of the following in a single DB transaction (all or nothing):

1. Archive the current season:
   - Insert a row into `seasons` with `user_id`, `season_number` (increment from last), `end_date = NOW()`, `final_xp`, `final_level`, `final_tokens` (sum of micro + standard) from the current `users` row

2. Reset the user:
   - `current_xp = 0`
   - `level = 1`
   - `wishlist_tokens_micro = 0`
   - `wishlist_tokens_standard = 0`
   - `state = 'ACTIVE'`
   - `current_season_id = (new season id from step 1)`

3. Reset wishlist items:
   - Set `is_purchased = false` for all wishlist items belonging to this user
   - Do NOT delete wishlist items — they carry over as per PRD.md Section 6, Flow 4

4. Regenerate quests:
   - Mark all existing `ACTIVE` quests as `FAILED`
   - Insert fresh default quests for the new season based on the quest types defined in `gameConfig.ts`

Return a `SeasonResetResult`:
```typescript
interface SeasonResetResult {
  success: boolean;
  archivedSeasonId: number;
  seasonNumber: number;
  newSeasonStartDate: string;
}
```

### 2. Wire the admin reset endpoint

Replace the stub in `POST /api/admin/reset-season`:
- Calls `resetSeason(req.user.id)`
- Returns the `SeasonResetResult` as JSON
- On error: returns 500 with the error message

This route must still be behind `requireAuth` — only the logged-in user can reset their own season.

### 3. Season history endpoint

Create `GET /api/user/:id/seasons`:
- Returns all rows from the `seasons` table for this user, ordered by `season_number` descending
- Response shape:
```typescript
interface SeasonSummary {
  id: number;
  season_number: number;
  start_date: string;
  end_date: string;
  final_xp: number;
  final_level: number;
  final_tokens: number;
}
```

### 4. Season history UI — Stats panel in Dashboard

Add a collapsible "Season History" section at the bottom of the Dashboard (collapsed by default).

When expanded, it fetches `GET /api/user/:id/seasons` and renders a simple table:
| Season | Level Reached | XP Earned | Tokens Spent |
|--------|--------------|-----------|--------------|

Keep it minimal. This is a portfolio showcase element, not a core feature.

### 5. Manual reset trigger in DevToolsPanel

Add a "Reset Season" button to `DevToolsPanel.tsx` (the dev tools panel built in Phase 3).
- Clicking it shows an inline confirm: "This will reset XP, tokens, and lock the Wishlist. Season will be archived. Continue?"
- On confirm: calls `POST /api/admin/reset-season`, shows the result in the panel, then calls `refetch()` on the dashboard
- This is the only way to trigger a reset for MVP

## Rules
- Do not automate the reset with a cron job — manual trigger only for MVP (noted in PRD.md Section 13)
- Do not delete wishlist items — only reset `is_purchased`
- All DB writes must be in a single transaction
- Do not add new pages

## Exit criteria — do not move to Phase 9 until all of these pass
- [ ] Triggering reset via DevToolsPanel archives the current season with correct `final_xp`, `final_level`, `final_tokens`
- [ ] After reset: `users.current_xp = 0`, `level = 1`, both token counts = 0
- [ ] After reset: all wishlist items still exist with `is_purchased = false`
- [ ] After reset: dashboard refreshes and shows Level 1, 0 XP, blank progress bar
- [ ] `GET /api/user/:id/seasons` returns the archived season with correct values
- [ ] Season history panel in Dashboard shows the archived season
- [ ] Triggering reset a second time creates a second season archive row with `season_number` incremented
- [ ] DB failure mid-reset rolls back everything — no partial resets
