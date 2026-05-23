# PHASE 6 — Vault & Wishlist
# Mode: Plan first, then Agent
# Exit criteria: Full add → earn tokens → redeem flow works end to end.

Read PRD.md in full before doing anything. It is the single source of truth. Do not contradict it.

---

Phase 5 is complete. We are building Phase 6 only. Do not touch auth, game logic, or the dashboard.

## What to build

### 1. Add Wishlist Item (backend)

Create `POST /api/user/:id/wishlist` (replace the stub):
- Accepts: `{ item_name: string, price_zar: number, token_cost?: number, token_type?: 'MICRO' | 'STANDARD' }`
- If `token_cost` and `token_type` are not provided, calculate them using the pricing formula in Section 4.4 of PRD.md — this logic must live in a helper function, not inline in the route
- Validates that `item_name` is not empty and `price_zar` is a positive number. Return 400 on failure.
- Inserts into `wishlist` table and returns the created item

### 2. Delete Wishlist Item (backend)

Create `DELETE /api/user/:id/wishlist/:itemId`:
- Verifies the item belongs to the requesting user before deleting (return 403 if not)
- Cannot delete a purchased item — return 400 with a clear error message
- Deletes the row and returns `{ success: true }`

### 3. Add Wishlist Item (frontend)

Add an "Add Item" button to `Vault.tsx` that opens a new `AddWishlistItemModal.tsx` component.

The modal contains:
- `item_name` text input
- `price_zar` number input
- A read-only "Suggested Token Cost" field that calculates in real time as the user types the price — use the pricing tiers from Section 4.4 of PRD.md implemented client-side
- An override toggle: "Use suggested cost" (default on) / "Set manually" — when set manually, show a token cost number input and a token type dropdown (MICRO | STANDARD)
- A "Add to Vault" button that calls `POST /api/user/:id/wishlist`
- On success: close modal, refetch wishlist
- On error: show error inside modal, do not close

### 4. Delete Wishlist Item (frontend)

Add a small delete icon/button to each non-purchased wishlist item card.
- Clicking it shows a simple inline confirm ("Remove this item?") — not a full modal
- On confirm: calls `DELETE /api/user/:id/wishlist/:itemId`, then refetches wishlist
- Purchased items do not show a delete button

### 5. Redemption flow — verify it's complete

The 2-step redemption was wired in Phase 4. Verify it still works correctly end to end with a real authenticated user:
- [ ] Redeem button only appears on affordable items
- [ ] Step 1 (`/redeem`) checks token balance server-side — cannot be bypassed by calling `/confirm-redeem` directly
- [ ] Step 2 (`/confirm-redeem`) deducts tokens and marks `is_purchased = true`
- [ ] Token count in the header updates after a successful redemption
- [ ] Redeemed item renders as "UNLOCKED" and no longer shows a Redeem button

If any of the above are broken, fix them before proceeding.

## Rules
- Do not change game logic, auth, or DB schema.
- The token cost calculation logic must exist in exactly one place — either a shared utility imported by both backend and frontend, or separately implemented in both but tested in both. No silent divergence.
- Do not install any new libraries.

## Exit criteria — do not move to Phase 7 until all of these pass
- [ ] Can add a wishlist item via the modal — it appears in the Vault immediately after
- [ ] Suggested token cost updates in real time as price is typed in the modal
- [ ] Manual override of token cost works correctly and is saved to the DB
- [ ] Can delete a non-purchased item — it disappears from the Vault
- [ ] Cannot delete a purchased item (button not shown, API also rejects)
- [ ] Full redemption flow: earn tokens via webhook → redeem item → item shows UNLOCKED → token count decremented
- [ ] Server-side token check on `/redeem` cannot be bypassed
