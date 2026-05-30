# PHASE 15 — The Shop v2
# Mode: Plan first, then Agent
# Exit criteria: Both Shop tabs work. Can earn Gems, buy cosmetics, see avatar update on dashboard.

Read PRD_v2.md Sections 6.3 and 8 before doing anything.

---

Phase 14 is complete. We are building the frontend for The Shop. The backend (shop endpoints, Gem economy) was built in Phase 13. This phase is frontend only unless a backend bug is found.

---

## What to build

### 1. Rename existing Vault/Shop page
The v1 Vault was renamed to "The Shop" in Phase 10. Now we're expanding it to a two-tab layout.

`client/src/pages/Shop.tsx` — two tabs:
- **Tab 1: Wishlist** (existing content, already built)
- **Tab 2: Budgteer Shop** (new content, built this phase)

The tab switcher lives at the top of the page. Default tab: Wishlist.

---

### 2. Tab 2 — Budgteer Shop

`client/src/components/BudgteerShop.tsx`

Fetches `GET /api/shop/items` on mount. Displays items in a grid.

**Item card states:**

**Owned + Equipped:**
- Shows item name and type
- "Equipped" label (green/accent coloured)
- No buy button

**Owned + Not Equipped:**
- Shows item name and type
- "Equip" button → calls `POST /api/shop/items/:itemId/buy` (the buy endpoint also handles equip — it updates `avatar_config` whether or not the user already owns it; the frontend just labels it differently)
- Wait — actually: create a separate `POST /api/shop/items/:itemId/equip` endpoint this phase for items the user already owns. This updates `avatar_config` without deducting Gems.

**Affordable (not owned):**
- Shows item name, type, and Gem cost
- Active "Buy" button showing Gem icon + cost
- Clicking opens a confirmation modal: "Buy [item name] for [X] Gems?" with Confirm + Cancel
- On confirm: calls `POST /api/shop/items/:itemId/buy`, deducts Gems, updates avatar

**Locked (not enough Gems):**
- Shows item name, type, and Gem cost
- Greyed out, no buy button
- Shows Gem deficit: "Need X more Gems"

**Default items (unlocked for all):**
- Shows "Free" label
- "Equip" button

### 3. Avatar update after purchase

After a successful buy or equip:
1. The API returns the updated `avatar_config`
2. Update the `avatar_config` in local state immediately (do not wait for a full page refetch)
3. The `BudgteerAvatar` component on the dashboard must reflect the change — lift `avatar_config` state up to a context or pass a refetch callback so the dashboard re-renders

Use React Context (`BudgteerContext`) to share `avatar_config` and `gems` between the Shop and Dashboard without prop drilling. Create `client/src/context/BudgteerContext.tsx`.

### 4. New backend endpoint: `POST /api/shop/items/:itemId/equip`

- Validates user owns the item (check `user_shop_items` table or `is_default = true`)
- If not owned: return 403
- Updates `users.avatar_config` with the item's `avatar_key: avatar_value`
- Returns updated `avatar_config`
- No Gem deduction

### 5. Gem balance display

After any purchase or equip:
- Update the Gem count displayed in the header in real time (via `BudgteerContext`)
- Show a toast: "Equipped: [item name]." or "Purchased: [item name]. [X] Gems remaining."

### 6. Empty state

If the user has no Gems and no owned items:
- Show: "Earn Gems by completing Weekly Quests, finishing a Season, and maintaining login streaks. Then come back to outfit your Budgteer."

---

## Rules
- Backend shop endpoints were built in Phase 13. Do not rewrite them — fix bugs only.
- The new `equip` endpoint is the only new backend addition this phase.
- DiceBear URL is always built client-side from `avatar_config` — never stored.
- Use `BudgteerContext` for shared avatar state. Do not pass `avatar_config` through 4 levels of props.
- Do not install any new libraries.

## Exit criteria — do not move to Phase 16 until all pass
- [ ] The Shop has two tabs: Wishlist and Budgteer Shop. Switching tabs works.
- [ ] Budgteer Shop loads and displays all shop items with correct states (owned, affordable, locked, default)
- [ ] Buying an item deducts Gems and shows the item as "Owned" immediately
- [ ] Buying with insufficient Gems shows 400 error inline — does not open the confirmation modal
- [ ] Equipping an owned item updates `avatar_config` without deducting Gems
- [ ] The Budgteer avatar on the dashboard updates immediately after a purchase or equip — no page refresh required
- [ ] Gem count in header decrements immediately after purchase
- [ ] Purchase/equip toast fires with correct message
- [ ] Default items show as free and equippable without purchase
- [ ] Empty state renders for users with no Gems and no owned items
