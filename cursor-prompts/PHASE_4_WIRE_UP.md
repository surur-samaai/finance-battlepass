# PHASE 4 — Wire Up
# Mode: Plan first, then Agent
# Exit criteria: Dashboard reflects real DB state. Webhook fired from DevToolsPanel changes the UI.

Read PRD.md in full before doing anything. It is the single source of truth. Do not contradict it.

---

Phase 3 is complete. We are building Phase 4 only. We are replacing all hardcoded fake data with real API calls. Do not add new UI. Do not change the DB schema.

## What to build

### 1. API client setup

Create `client/src/api/client.ts`:
- Use `axios` with a base URL pointing to `http://localhost:3000` (from a `VITE_API_URL` env var)
- Set `withCredentials: true` on every request (required for session cookies once auth is added in Phase 5)
- Export typed functions for each endpoint — do not make raw `axios` calls scattered across components

Create one file per resource:
- `client/src/api/user.ts` — dashboard data fetch
- `client/src/api/wishlist.ts` — wishlist fetch, redeem step 1, confirm-redeem step 2
- `client/src/api/quests.ts` — quest completion
- `client/src/api/webhooks.ts` — mock bank webhook fire

### 2. Custom hook: `useDashboard.ts`

Create `client/src/hooks/useDashboard.ts`:
- Fetches `GET /api/user/:id/dashboard` on mount
- Returns `{ user, quests, loading, error, refetch }`
- `refetch` must be callable after any action (quest complete, webhook fire) to refresh state
- Handle loading and error states explicitly — do not leave them undefined

### 3. Wire Dashboard

Replace all hardcoded `fakeUser` and `fakeQuests` data in `Dashboard.tsx` with real data from `useDashboard`.

- Show a loading state while fetching (simple text or spinner — no library)
- Show an error state if the fetch fails
- Quest "Complete" button calls `POST /api/user/:id/quests/:questId/complete`, then calls `refetch()`
- After refetch, the XP bar and level badge must update to reflect new values

### 4. Wire Vault

Replace hardcoded `fakeWishlist` with real data from `GET /api/user/:id/wishlist`.

Redemption flow (2 steps):
- Step 1: Clicking "Redeem" calls `POST /api/user/:id/wishlist/:itemId/redeem`
  - If the backend returns success (tokens available), open the `RedemptionModal`
  - If the backend returns an error (not enough tokens), show an inline error message on the item — do not open the modal
- Step 2: Clicking "Confirm" in the modal calls `POST /api/user/:id/wishlist/:itemId/confirm-redeem`
  - On success: close modal, refetch wishlist, update token count in header
  - On error: show error inside the modal, do not close it

### 5. Wire DevToolsPanel

The webhook form in `DevToolsPanel.tsx` must now actually fire `POST /api/webhooks/mock-bank`.

On submit:
- Send the form fields as the `BankWebhookPayload` (see Section 8.3 of PRD.md)
- On success: display the `GameEngineResult` returned from the backend inside the panel (show `newState`, `xpAwarded`, `isViolation`, `toastMessages` as plain text)
- Call `refetch()` on the dashboard hook so the UI updates immediately
- On error: show the error message inside the panel

### 6. Toast notifications

Implement a simple toast system:
- Create `client/src/components/Toast.tsx` — a fixed-position container that renders toast messages
- Toasts appear bottom-right, auto-dismiss after 4 seconds
- Triggered by: quest completion XP, level-up, token award, gulag entry, gulag progress, gulag exit, wishlist redemption
- Use the exact toast messages from Section 10 of PRD.md — no variations
- Do not install a toast library. Build it with `useState` and `setTimeout`.

### 7. Hardcode the user ID for now

Since auth is Phase 5, hardcode `userId = 1` in all API calls for now. Add a `TODO: replace with session user ID after Phase 5` comment wherever this appears so it's easy to find and replace.

## Rules
- Do not add new UI components or pages.
- Do not change any backend routes or DB schema.
- Do not install any new frontend libraries except `axios` if not already installed.
- All API response types must be defined as TypeScript interfaces in `client/src/api/types.ts` — no `any`.
- `SKIP_AUTH=true` must still be set in the backend `.env` during this phase.

## Exit criteria — do not move to Phase 5 until all of these pass
- [ ] Dashboard loads real data from the DB on mount
- [ ] Completing a quest via the UI updates XP in real time (after refetch)
- [ ] Firing the mock webhook via DevToolsPanel changes DB state and the Dashboard updates
- [ ] Firing a violation webhook transitions the UI to Gulag state (GulagOverlay appears)
- [ ] Wishlist loads real items and correctly shows affordable vs locked based on real token count
- [ ] 2-step redemption flow works end to end: modal opens only on valid token check, confirm deducts tokens
- [ ] Toast fires correctly after: quest complete, level up, token award, gulag entry
- [ ] No hardcoded fake data remains anywhere in the frontend
- [ ] No `any` types in API response handling
- [ ] Network tab shows real API calls being made and succeeding
