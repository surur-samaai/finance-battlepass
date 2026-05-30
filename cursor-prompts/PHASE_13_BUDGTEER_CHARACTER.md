# PHASE 13 — Budgteer Character System
# Mode: Plan first, then Agent
# Exit criteria: DiceBear avatar on dashboard. Gem economy active. Character customisation works.

Read PRD_v2.md Sections 6 and 8 before doing anything.

---

Phase 12 is complete. We are wiring the Budgteer character system. This phase has three parts: DiceBear avatar rendering, Gem economy, and the cosmetics shop backend.

---

## Part 1 — DiceBear Avatar

### 1. `AvatarConfig` interface
Define once in `client/src/types/character.ts`:
```typescript
export interface AvatarConfig {
  style: string;
  seed: string;
  hair?: string;
  hairColor?: string;
  skinColor?: string;
  eyes?: string;
  accessories?: string[];
  backgroundColor?: string;
}
```

### 2. Avatar URL builder utility
Create `client/src/utils/avatarUrl.ts`:
```typescript
import { AvatarConfig } from '../types/character'

export function buildAvatarUrl(config: AvatarConfig): string {
  const params = new URLSearchParams()
  Object.entries(config).forEach(([key, value]) => {
    if (value !== undefined && key !== 'style' && key !== 'seed') {
      params.set(key, Array.isArray(value) ? value.join(',') : String(value))
    }
  })
  return `https://api.dicebear.com/9.x/${config.style}/svg?seed=${config.seed}&${params.toString()}`
}
```

### 3. `BudgteerAvatar` component
Create `client/src/components/BudgteerAvatar.tsx`:
- Takes `avatarConfig: AvatarConfig` and `size: 'sm' | 'md' | 'lg'` as props
- Renders an `<img>` tag with the DiceBear URL built from `buildAvatarUrl(avatarConfig)`
- Size maps: sm = 48px, md = 96px, lg = 160px
- Shows a grey placeholder silhouette while the image loads
- On image error: shows the placeholder silhouette (DiceBear is external — handle network failures gracefully)

### 4. Wire avatar into onboarding Step 4
Replace the static placeholder in `Onboarding.tsx` Step 4:
- Generate a random `seed` (use the user's Supabase ID as the seed for consistency)
- Default `style: 'adventurer'`
- Let user pick from a subset of customisation options (hair style, hair colour, skin colour) rendered as clickable swatches
- Each selection updates the `AvatarConfig` in local state and re-renders the `BudgteerAvatar` preview in real time
- Save the final `AvatarConfig` as part of the onboarding complete payload

### 5. Wire avatar to dashboard
In `Dashboard.tsx`:
- Fetch `avatar_config` from `GET /api/user/:id/character`
- Replace the level/XP header area with the Budgteer card:
  - `BudgteerAvatar` (size `lg`)
  - Budgteer name
  - Level badge
  - XP bar
  - Dynamic status line (see PRD_v2.md Section 6.2)

### 6. Backend: `GET /api/user/:id/character`
Replace the stub. Returns:
```typescript
{
  budgteer_name: string,
  avatar_config: AvatarConfig,
  gems: number,
  login_streak: number,
  level: number,
  current_xp: number
}
```

---

## Part 2 — Gem Economy

### 7. Gem award service
Create `server/src/services/characterService.ts` with a function:
```typescript
export async function awardGems(userId: number, amount: number, reason: string): Promise<void>
```
- Increments `users.gems` by `amount`
- Logs the award reason (use a simple `console.log` for now — a gem ledger table is a v3 feature)
- Uses the Gem reward values from `gameConfig.ts` (`GEM_REWARDS`) — no magic numbers

### 8. Wire Gem awards to triggers
Add `awardGems` calls at the correct points:
- **Weekly quest complete**: in the quest completion handler, after marking a WEEKLY quest complete
- **Season complete (Level 10 reached)**: in `gameLogicEngine.ts`, after the Level 10 level-up
- **7-day login streak**: in a new `updateLoginStreak(userId)` function called every time a user successfully authenticates via `requireAuth` middleware

**Login streak logic** (`server/src/services/characterService.ts`):
```typescript
export async function updateLoginStreak(userId: number): Promise<void>
```
- Fetch `users.last_login_date` and `users.login_streak`
- If `last_login_date` is yesterday: increment `login_streak` by 1
- If `last_login_date` is today: do nothing (already logged in today)
- If `last_login_date` is more than 1 day ago: reset `login_streak` to 1
- Update `last_login_date = TODAY`
- If `login_streak` reaches `LOGIN_STREAK_GEM_MILESTONE` (from `gameConfig.ts`): call `awardGems` and reset streak to 0

Call `updateLoginStreak` inside `requireAuth` middleware, after the user is verified, before calling `next()`.

### 9. Gem count in UI
- Add Gems to the header/sidebar alongside Coins
- Use a distinct icon or colour to differentiate Gems from Coins (Gems = purple accent, Coins = gold/yellow — these are the only two exceptions to the single accent colour rule, and only for currency icons)
- Fetch Gem count from `GET /api/user/:id/character`

---

## Part 3 — Cosmetic Shop Backend

### 10. DB migrations
Run migrations from PRD_v2.md Section 6.4:

`009_shop_items.sql`:
```sql
CREATE TABLE shop_items (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  item_type    VARCHAR(50) NOT NULL,
  gem_cost     INTEGER NOT NULL,
  avatar_key   VARCHAR(100) NOT NULL,
  avatar_value VARCHAR(100) NOT NULL,
  is_default   BOOLEAN DEFAULT FALSE
);

CREATE TABLE user_shop_items (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id),
  shop_item_id INTEGER REFERENCES shop_items(id),
  purchased_at TIMESTAMP DEFAULT NOW()
);
```

### 11. Seed shop items
Create `server/db/seeds/seed_shop_items.sql` with at least 10 items covering all item types (hair, hair_color, accessory, background, style). Use the DiceBear `adventurer` style's documented options for valid `avatar_key` and `avatar_value` values. Mark 2–3 items as `is_default = true` (unlocked for all users at no cost).

Run this seed file against the DB.

### 12. Shop API endpoints
Replace stubs with real logic:

`GET /api/shop/items`:
- Returns all shop items
- Each item includes an `owned` boolean (true if the user has purchased it or it's a default item)
- Each item includes an `equipped` boolean (true if the item's `avatar_value` currently matches the user's `avatar_config`)

`POST /api/shop/items/:itemId/buy`:
- Validates user has enough Gems (`users.gems >= shop_items.gem_cost`)
- If not enough Gems: return 400 with a clear message
- Deduct Gems from `users.gems`
- Insert into `user_shop_items`
- Update `users.avatar_config` with the new item's `avatar_key: avatar_value`
- Return updated `avatar_config` and remaining `gems`
- All in a single DB transaction

## Rules
- DiceBear URL is always constructed client-side from `avatar_config`. Never store the URL in the DB.
- `GEM_REWARDS` and `GEM_SHOP_PRICES` constants from `gameConfig.ts` only — no magic numbers.
- The cosmetics shop backend (endpoints) is built this phase. The frontend shop UI comes in Phase 15.
- Do not add the "First bank connection" Gem award yet — that requires Stitch (Phase 14).

## Exit criteria — do not move to Phase 14 until all pass
- [ ] Dashboard shows the Budgteer avatar (DiceBear) with the user's stored `avatar_config`
- [ ] Budgteer name displays on dashboard
- [ ] Onboarding Step 4 renders DiceBear avatar in real time as user selects options
- [ ] Avatar config is saved correctly during onboarding
- [ ] Gems display in header, separate from Coins
- [ ] Completing a Weekly quest awards Gems (verify in DB)
- [ ] Reaching Level 10 awards Season Complete Gems (verify in DB)
- [ ] Login streak increments correctly on consecutive daily logins
- [ ] 7-day login streak awards Gems and resets streak (test by manually setting `last_login_date` back 6 days in DB)
- [ ] `GET /api/shop/items` returns items with correct `owned` and `equipped` flags
- [ ] `POST /api/shop/items/:itemId/buy` deducts Gems, inserts ownership row, updates `avatar_config` — all in one DB transaction
- [ ] Buying a cosmetic with insufficient Gems returns 400
