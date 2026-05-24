---
name: Phase 3 Frontend Shell
overview: Scaffold the `client/` Vite + React + TypeScript + Tailwind app from zero, build all pages and components with hardcoded data exactly as specified in PHASE_3_FRONTEND_SHELL.md, and satisfy every exit criterion before touching any API.
todos:
  - id: scaffold-vite
    content: Scaffold client/ with Vite + React + TS, install Tailwind and React Router
    status: completed
  - id: config-files
    content: Configure tailwind.config.ts (darkMode, accent colour), postcss.config.js, index.html (Inter font, dark class), index.css
    status: completed
  - id: types
    content: Create client/src/types/index.ts with User, Quest, WishlistItem interfaces
    status: completed
  - id: routing-shell
    content: Create main.tsx (BrowserRouter), App.tsx (routes + top nav)
    status: completed
  - id: components
    content: Build XPBar, QuestCard, WishlistItem, GulagOverlay, RedemptionModal, DevToolsPanel
    status: completed
  - id: page-dashboard
    content: Build Dashboard.tsx with all required elements and hardcoded fakeUser/fakeQuests
    status: completed
  - id: page-vault
    content: Build Vault.tsx with WishlistItem grid and RedemptionModal wiring
    status: completed
  - id: page-onboarding
    content: Build Onboarding.tsx with 3-step form and token cost suggestion logic
    status: completed
  - id: stub-hook
    content: Create client/src/hooks/useDashboard.ts as a stub (no fetch)
    status: completed
  - id: verify-exit-criteria
    content: Run npm run dev in client/, verify all 8 exit criteria in browser
    status: completed
isProject: false
---

# Phase 3 — Frontend Shell Execution Plan

## Starting State

`client/` does not exist. The root `package.json` is backend-only. All frontend work is net-new inside `client/`.

---

## Step 1 — Scaffold the Vite app

Run `npm create vite@latest client -- --template react-ts` from the project root. This produces `client/` with its own `package.json`, `tsconfig.json`, `index.html`, `vite.config.ts`, and `src/`.

Then inside `client/`:

- `npm install react-router-dom`
- `npm install -D tailwindcss postcss autoprefixer`
- `npx tailwindcss init -p` to generate `tailwind.config.ts` and `postcss.config.js`

---

## Step 2 — Configuration files

**[`client/tailwind.config.ts`](client/tailwind.config.ts)**

- `darkMode: 'class'`
- Extend colors: `accent: '#4A90D9'`
- Content paths cover `./index.html` and `./src/**/*.{ts,tsx}`

**[`client/src/index.css`](client/src/index.css)**

- Tailwind directives (`@tailwind base/components/utilities`)
- Body: `background-color: #0D0D0D; color: white; font-family: Inter, sans-serif`

**[`client/index.html`](client/index.html)**

- Add `class="dark"` to `<html>`
- Import Inter from Google Fonts (`<link>` preconnect + stylesheet)

---

## Step 3 — Types

**[`client/src/types/index.ts`](client/src/types/index.ts)** — all shared frontend interfaces:

```typescript
export interface User {
  username: string;
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  playable_balance: number;
  state: "ACTIVE" | "GULAG" | "REDEMPTION";
  wishlist_tokens_micro: number;
  wishlist_tokens_standard: number;
}
export interface Quest {
  id: number;
  title: string;
  xp_reward: number;
  quest_type: "DAILY" | "WEEKLY" | "GULAG_REDEMPTION";
  status: "ACTIVE" | "COMPLETE" | "FAILED";
  streak_count?: number;
}
export interface WishlistItem {
  id: number;
  item_name: string;
  price_zar: number;
  token_cost: number;
  token_type: "MICRO" | "STANDARD";
  is_purchased: boolean;
}
```

---

## Step 4 — Routing & shell

**[`client/src/main.tsx`](client/src/main.tsx)** — wraps `<App />` in `<BrowserRouter>`.

**[`client/src/App.tsx`](client/src/App.tsx)**

- Top nav bar: links to `/` (Dashboard) and `/vault` (Vault). Accent-coloured active link.
- Routes: `/` → `Dashboard`, `/vault` → `Vault`, `/onboarding` → `Onboarding`.

---

## Step 5 — Components

### [`client/src/components/XPBar.tsx`](client/src/components/XPBar.tsx)

- Props: `currentXP: number`, `xpToNext: number`, `isGulag?: boolean`
- Renders a dark track bar, accent-filled inner bar at `(currentXP/xpToNext)*100%`
- `transition-all duration-500` on the fill (only CSS transition allowed this phase)
- When `isGulag`: apply `grayscale` filter + render a padlock icon over the bar

### [`client/src/components/QuestCard.tsx`](client/src/components/QuestCard.tsx)

- Props: `quest: Quest`
- Shows: title, XP reward badge, `DAILY`/`WEEKLY`/`GULAG_REDEMPTION` pill, "Complete" button
- Button renders for all quest types but does nothing on click yet

### [`client/src/components/WishlistItem.tsx`](client/src/components/WishlistItem.tsx)

- Props: `item: WishlistItem`, `microTokens: number`, `standardTokens: number`, `onRedeem: (item: WishlistItem) => void`
- Affordability check: `token_type === 'MICRO'` → compare `microTokens >= token_cost`; `STANDARD` → compare `standardTokens >= token_cost`
- **Affordable**: `ring-2 ring-accent shadow-[0_0_12px_#4A90D9]`, active "Redeem" button calling `onRedeem`
- **Locked**: `opacity-50`, lock icon (🔒 unicode or inline SVG), shows `"Need X more [type] token(s)"`
- **Purchased**: `opacity-30`, "UNLOCKED" label stamped over it, no button

### [`client/src/components/GulagOverlay.tsx`](client/src/components/GulagOverlay.tsx)

- Props: `streakCount?: number` (hardcoded to `1` for now)
- Renders the XP bar area replacement: desaturated/grayscale XP bar with padlock, bold "BATTLE PASS FROZEN" label, streak counter `Day 1 / 3`

### [`client/src/components/RedemptionModal.tsx`](client/src/components/RedemptionModal.tsx)

- Props: `item: WishlistItem`, `onClose: () => void`, `onConfirm: () => void`
- Fixed-position overlay, dark card centred on screen
- Shows item name, token cost + type, "Confirm" button (calls `onConfirm`, wired to nothing yet), "Cancel" button (calls `onClose`)

### [`client/src/components/DevToolsPanel.tsx`](client/src/components/DevToolsPanel.tsx)

- Local `isOpen` boolean state, default `false`
- Toggle button always visible (bottom of Dashboard)
- When open: form with `amount` (number input), `merchant` (text input), `system_category` (select: `FIXED_BILL` | `DISCRETIONARY`)
- Submit: `console.log` only — no fetch call

---

## Step 6 — Pages

### [`client/src/pages/Dashboard.tsx`](client/src/pages/Dashboard.tsx)

Hardcoded data (exactly as spec'd):

```typescript
const fakeUser = {
  username: "Player One",
  level: 4,
  current_xp: 520,
  xp_to_next_level: 700,
  playable_balance: 3240.0,
  state: "ACTIVE",
  wishlist_tokens_micro: 1,
  wishlist_tokens_standard: 0,
};
const fakeQuests = [
  {
    id: 1,
    title: "Zero Spend Day",
    xp_reward: 25,
    quest_type: "DAILY",
    status: "ACTIVE",
  },
  {
    id: 2,
    title: "Meal Prep",
    xp_reward: 20,
    quest_type: "DAILY",
    status: "ACTIVE",
  },
  {
    id: 3,
    title: "Weekly Streak",
    xp_reward: 100,
    quest_type: "WEEKLY",
    status: "ACTIVE",
  },
];
```

Layout:

- **Header row**: username, state badge (green/red/amber), token counts (Micro + Standard)
- **Hero section**: large level badge, playable balance, `XPBar` (or `GulagOverlay` if state is `GULAG`)
- **Quest list**: maps `fakeQuests` → `QuestCard`
- **Footer**: `DevToolsPanel`

State badge colours: `ACTIVE` = `bg-green-600`, `GULAG` = `bg-red-600 animate-pulse`, `REDEMPTION` = `bg-amber-500`

### [`client/src/pages/Vault.tsx`](client/src/pages/Vault.tsx)

Hardcoded data (exactly as spec'd):

```typescript
const fakeWishlist = [
  {
    id: 1,
    item_name: "Nando's Quarter Chicken",
    price_zar: 89,
    token_cost: 1,
    token_type: "MICRO",
    is_purchased: false,
  },
  {
    id: 2,
    item_name: "New mechanical keyboard",
    price_zar: 650,
    token_cost: 3,
    token_type: "STANDARD",
    is_purchased: false,
  },
  {
    id: 3,
    item_name: "Coffee",
    price_zar: 45,
    token_cost: 1,
    token_type: "MICRO",
    is_purchased: true,
  },
];
```

- Local state: `selectedItem: WishlistItem | null = null`
- Grid of `WishlistItem` components; `onRedeem` sets `selectedItem`
- When `selectedItem !== null`: renders `RedemptionModal`; `onConfirm` and `onClose` both reset `selectedItem` to `null`

### [`client/src/pages/Onboarding.tsx`](client/src/pages/Onboarding.tsx)

- Local `step: 1 | 2 | 3` state
- Step 1: `<input>` for monthly net income
- Step 2: array of `{ name: string, amount: string }` items, "Add another" button appends a new row, each row has name + amount inputs
- Step 3: `item_name` + `price_zar` input; shows computed suggestion from PRD §4.4 formula:
  - `< 50` → "1 Micro-Token", `50–150` → "1 Standard Token", `150–400` → "2 Standard Tokens", `400–800` → "3 Standard Tokens", `> 800` → "Set manually"
- "Next" button advances `step` (no validation); on Step 3 it does nothing (or navigates to `/`)

---

## Step 7 — Stub hook

**[`client/src/hooks/useDashboard.ts`](client/src/hooks/useDashboard.ts)**

- Exports a stub `useDashboard()` that returns the same hardcoded `fakeUser` and `fakeQuests` objects — no fetch
- Not yet used by Dashboard (Dashboard imports fakeData inline), but the file must exist per PRD §12 structure

---

## File Creation Summary

| File                                        | Purpose                                          |
| ------------------------------------------- | ------------------------------------------------ |
| `client/package.json`                       | Vite + React + TS + Tailwind + React Router deps |
| `client/vite.config.ts`                     | Vite config (no proxy needed)                    |
| `client/tailwind.config.ts`                 | Dark mode class, accent colour                   |
| `client/postcss.config.js`                  | Tailwind + autoprefixer                          |
| `client/tsconfig.json`                      | Strict TS for client                             |
| `client/index.html`                         | Inter font import, `<html class="dark">`         |
| `client/src/main.tsx`                       | BrowserRouter entry                              |
| `client/src/App.tsx`                        | Routes + top nav                                 |
| `client/src/index.css`                      | Tailwind directives + body styles                |
| `client/src/types/index.ts`                 | User, Quest, WishlistItem interfaces             |
| `client/src/pages/Dashboard.tsx`            | Main dashboard with all required elements        |
| `client/src/pages/Vault.tsx`                | Wishlist grid + redemption modal wiring          |
| `client/src/pages/Onboarding.tsx`           | 3-step form                                      |
| `client/src/components/XPBar.tsx`           | Animated progress bar                            |
| `client/src/components/QuestCard.tsx`       | Quest display card                               |
| `client/src/components/WishlistItem.tsx`    | Affordable/locked/purchased states               |
| `client/src/components/GulagOverlay.tsx`    | Gulag state XP replacement                       |
| `client/src/components/RedemptionModal.tsx` | Confirmation modal                               |
| `client/src/components/DevToolsPanel.tsx`   | Collapsible webhook form                         |
| `client/src/hooks/useDashboard.ts`          | Stub hook (no fetch)                             |

---

## Exit Criteria Mapping

- `npm run dev` in `client/` → no console errors (Step 1–4 handles this)
- Dashboard shows all required elements → Step 6 Dashboard
- `fakeUser.state = "GULAG"` renders GulagOverlay → `GulagOverlay` conditional in Dashboard
- Vault affordable/locked/purchased states → `WishlistItem` component logic
- Redemption modal opens on Redeem → `selectedItem` state in Vault
- DevToolsPanel collapsed by default with form → `isOpen` state in DevToolsPanel
- Onboarding 3 steps with Next → `step` state in Onboarding
- Zero API calls → no `fetch`/`axios` anywhere (verify via Network tab)
