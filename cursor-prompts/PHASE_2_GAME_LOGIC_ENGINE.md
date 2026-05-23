# PHASE 2 — Game Logic Engine
# Mode: Plan first, then Agent
# Exit criteria: Webhook fires → DB state changes correctly. Unit tests pass.

Read PRD.md in full before doing anything. It is the single source of truth. Do not contradict it.

---

Phase 1 is complete. We are building Phase 2 only. Do not touch the frontend. Do not change the DB schema or any migration files.

## What to build

### 1. `server/src/services/gameLogicEngine.ts`

This is the most critical file in the project. It must be a standalone, exported TypeScript function — never inline logic inside a route handler.

Implement the exact processing flow from Section 9 of PRD.md:

```
Receive payload
  → Validate shape (throw on invalid)
  → FIXED_BILL? → deduct balance, log transaction, return. Stop.
  → user.state === 'GULAG'? → deduct balance, log with is_violation=true, return. Stop.
  → Violation of active quests?
      NO  → deduct balance, maintain streaks, award XP if quest criteria met
      YES → deduct balance, set state='GULAG', auto-generate GULAG_REDEMPTION quest, log is_violation=true
  → Recalculate XP, check level thresholds from gameConfig.ts
  → If level-up: increment level, award token if applicable
  → Save ALL state changes in a single DB transaction (all or nothing)
```

The function signature must be:
```typescript
export async function processTransaction(
  payload: BankWebhookPayload,
  userId: number
): Promise<GameEngineResult>
```

Where `GameEngineResult` contains:
```typescript
interface GameEngineResult {
  success: boolean;
  newState: 'ACTIVE' | 'GULAG' | 'REDEMPTION';
  xpAwarded: number;
  leveledUp: boolean;
  tokenAwarded: 'MICRO' | 'STANDARD' | null;
  isViolation: boolean;
  toastMessages: string[];  // use the exact messages from Section 10 of PRD.md
}
```

**Critical rules for this function:**
- All XP thresholds and token rules must come from `gameConfig.ts`. No hardcoded numbers.
- All DB writes must be wrapped in a single `pg` transaction (`BEGIN` / `COMMIT` / `ROLLBACK`).
- If any DB write fails, roll back everything and throw.
- `GULAG` does NOT reset XP or Level. It only freezes accumulation. See Section 5 of PRD.md.
- `GULAG_REDEMPTION` quests cannot be manually completed — this is enforced in the quest completion route, not here.

### 2. Wire the webhook route

Replace the stub in `POST /api/webhooks/mock-bank` with a real handler that:
- Validates the incoming payload against the `BankWebhookPayload` interface from Section 8.3 of PRD.md
- Calls `processTransaction(payload, userId)`
- Returns the `GameEngineResult` as JSON
- Returns 400 on invalid payload, 500 on engine error

### 3. Wire the quest completion route

Replace the stub in `POST /api/user/:id/quests/:questId/complete` with a real handler that:
- Looks up the quest by ID
- Rejects with 403 if `quest_type === 'GULAG_REDEMPTION'` (these cannot be manually completed)
- Marks quest `status = 'COMPLETE'`
- Awards XP from `quest.xp_reward`
- Calls the level-up check logic (extract this as a shared helper so both the webhook and this route can use it)
- Returns updated XP, level, and any toast messages

### 4. Unit tests

After the engine is built, write unit tests in `server/src/services/gameLogicEngine.test.ts`.

Test every state transition defined in Section 5 of PRD.md:
- `ACTIVE` + valid spend → stays `ACTIVE`, XP awarded
- `ACTIVE` + violation → transitions to `GULAG`, XP frozen, quest generated
- `GULAG` + any discretionary spend → stays `GULAG`, no XP
- `GULAG` + `FIXED_BILL` → balance deducted, no state change
- Level 5 threshold crossed → Micro-Token awarded
- Level 10 threshold crossed → Standard Token awarded
- DB failure mid-write → rolls back, state unchanged

Use a test DB or mock the `pg` pool — your choice, but every test must be runnable with `npm test`.

## Rules
- No frontend changes.
- No schema changes. If you think you need one, stop and tell me why.
- All XP and token values from `gameConfig.ts` only.
- The engine function must be pure enough to unit test without a real DB if mocked.

## Exit criteria — do not move to Phase 3 until all of these pass
- [ ] Firing `POST /api/webhooks/mock-bank` with a valid `DISCRETIONARY` payload changes `users.state`, `current_xp`, and logs a row in `transactions`
- [ ] Firing with a `FIXED_BILL` payload deducts balance and logs a transaction but does NOT trigger game logic
- [ ] A violation payload sets `users.state = 'GULAG'` and creates a `GULAG_REDEMPTION` quest row
- [ ] A second webhook fired while in `GULAG` does not change XP or level
- [ ] Level-up logic awards the correct token type at Level 5 and Level 10
- [ ] All DB writes succeed or all fail — never partial
- [ ] All unit tests pass with `npm test`
