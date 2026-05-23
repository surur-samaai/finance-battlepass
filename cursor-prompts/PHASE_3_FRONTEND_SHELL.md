# PHASE 3 — Frontend Shell
# Mode: Plan first, then Agent
# Exit criteria: Dashboard renders correctly with hardcoded data. No API calls. No animations yet.

Read PRD.md in full before doing anything. It is the single source of truth. Do not contradict it.

---

Phase 2 is complete. We are building Phase 3 only. Do not touch the backend. Do not make any API calls from the frontend yet — all data must be hardcoded for now.

## What to build

### 1. Scaffold the React client in `client/`

- Vite + React + TypeScript
- Tailwind CSS (dark mode configured as `class` strategy — default to dark)
- React Router for page navigation
- Create the folder structure from Section 12 of PRD.md exactly

### 2. Global styles

- Background: `#0D0D0D` or equivalent near-black
- Primary accent colour: `#4A90D9` (electric blue) — define this as a Tailwind custom colour in `tailwind.config.ts`
- Font: Inter (import from Google Fonts in `index.html`)
- Dark mode only. No light mode classes anywhere.

### 3. Pages — use hardcoded fake data for everything

#### `Dashboard.tsx`
Use this hardcoded data shape (this will be replaced with real API data in Phase 4):
```typescript
const fakeUser = {
  username: "Player One",
  level: 4,
  current_xp: 520,
  xp_to_next_level: 700,
  playable_balance: 3240.00,
  state: "ACTIVE", // try "GULAG" and "REDEMPTION" to test all states
  wishlist_tokens_micro: 1,
  wishlist_tokens_standard: 0,
}

const fakeQuests = [
  { id: 1, title: "Zero Spend Day", xp_reward: 25, quest_type: "DAILY", status: "ACTIVE" },
  { id: 2, title: "Meal Prep", xp_reward: 20, quest_type: "DAILY", status: "ACTIVE" },
  { id: 3, title: "Weekly Streak", xp_reward: 100, quest_type: "WEEKLY", status: "ACTIVE" },
]
```

Must display:
- XP progress bar (filled proportionally: `current_xp / xp_to_next_level`). Accent colour fill.
- Level badge (large, readable)
- Playable balance (prominent). Do NOT show total balance.
- User state badge: `ACTIVE` = green | `GULAG` = red | `REDEMPTION` = amber
- Quest list: title, XP reward, a "Complete" button for manual quests (button is wired to nothing yet — just renders)
- Token counts in header: Micro and Standard tokens displayed separately

#### `Vault.tsx`
Use this hardcoded data:
```typescript
const fakeWishlist = [
  { id: 1, item_name: "Nando's Quarter Chicken", price_zar: 89, token_cost: 1, token_type: "MICRO", is_purchased: false },
  { id: 2, item_name: "New mechanical keyboard", price_zar: 650, token_cost: 3, token_type: "STANDARD", is_purchased: false },
  { id: 3, item_name: "Coffee", price_zar: 45, token_cost: 1, token_type: "MICRO", is_purchased: true },
]
```

Must display:
- Grid of wishlist items
- Affordable items (user has enough tokens): glowing accent border, active "Redeem" button
- Locked items (not enough tokens): greyed out, lock icon, shows how many more tokens needed
- Purchased items: visually de-emphasised, "UNLOCKED" stamp or label
- Redeem button opens a confirmation modal showing item name + cost. Modal has a "Confirm" button (wired to nothing yet).

#### `Onboarding.tsx`
Simple multi-step form. No submission logic yet — just renders the fields:
- Step 1: Enter monthly net income
- Step 2: Enter fixed costs (with an "Add another" button to add multiple line items)
- Step 3: Wishlist item entry (name + price, with a suggested token cost shown based on the pricing tiers in Section 4.4 of PRD.md)
- A "Next" button between steps (no validation yet)

### 4. Components

Build each as a standalone component:
- `XPBar.tsx` — takes `currentXP` and `xpToNext` as props, renders animated progress bar
- `QuestCard.tsx` — takes a quest object as props, renders card with complete button
- `WishlistItem.tsx` — takes a wishlist item and user token counts as props, handles affordable/locked/purchased states
- `GulagOverlay.tsx` — renders when `user.state === 'GULAG'`: desaturated XP bar with padlock, redemption quest progress (fake `1/3` for now)
- `RedemptionModal.tsx` — confirmation modal for wishlist redemption (no submit logic yet)
- `DevToolsPanel.tsx` — a collapsible panel (hidden by default, toggle with a button) with a form to manually fire the mock bank webhook. Fields: `amount`, `merchant`, `system_category` (dropdown: FIXED_BILL | DISCRETIONARY). Submit is wired to nothing yet.

### 5. Navigation

Simple sidebar or top nav with links to Dashboard and Vault. No auth guards yet.

## Rules
- Zero API calls this phase. All data is hardcoded.
- Zero animations this phase (CSS transitions on the XP bar fill are fine, nothing more).
- Zero auth this phase.
- Do not install any component library (no shadcn, no MUI). Tailwind only.
- Do not spend time pixel-perfecting. Get the structure right. Polish comes in Phase 9.

## Exit criteria — do not move to Phase 4 until all of these pass
- [ ] `npm run dev` in `client/` renders the app in-browser with no console errors
- [ ] Dashboard displays all required elements with fake data
- [ ] Changing `fakeUser.state` to `"GULAG"` renders the GulagOverlay correctly
- [ ] Vault correctly distinguishes affordable / locked / purchased items with fake data
- [ ] Redemption modal opens on clicking Redeem (no submit logic needed)
- [ ] DevToolsPanel renders (collapsed by default) with the webhook form fields
- [ ] Onboarding renders all 3 steps with Next navigation
- [ ] No API calls are made (verify in browser Network tab — it should be empty)
