# Cursor Prompts — Finance Battle Pass

One prompt file per phase. Use them in order. Do not skip ahead.

## How to use each prompt

1. Open Cursor
2. Switch to **Plan mode**
3. Paste the full contents of the phase file
4. Review Cursor's plan — if anything contradicts PRD.md, correct it before proceeding
5. Switch to **Agent mode** and let it build
6. Manually verify every exit criteria checkbox before moving to the next phase
7. **Commit to Git** before starting the next phase

---

## Phase index

| File | Phase | Key output |
|------|-------|------------|
| `PHASE_1_FOUNDATION.md` | Foundation | Express skeleton, DB migrations, stub routes, gameConfig.ts |
| `PHASE_2_GAME_LOGIC_ENGINE.md` | Game Logic | gameLogicEngine.ts, webhook handler, unit tests |
| `PHASE_3_FRONTEND_SHELL.md` | Frontend Shell | React app, all pages with hardcoded data, no API calls |
| `PHASE_4_WIRE_UP.md` | Wire Up | Real API calls, toasts, DevToolsPanel fires webhook |
| `PHASE_5_AUTH.md` | Auth | Google OAuth, session middleware, route guards |
| `PHASE_6_VAULT_WISHLIST.md` | Vault & Wishlist | Add/delete items, full redemption flow |
| `PHASE_7_GULAG_UI.md` | Gulag UI | Full state loop visible and functional |
| `PHASE_8_SEASON_RESET.md` | Season Reset | Archive, wipe, carry over wishlist |
| `PHASE_9_POLISH_DEPLOY.md` | Polish & Deploy | Animations, responsive, live on Railway + Vercel |

---

## If Cursor goes off-script

1. Do not argue in the same session — context drift makes it worse
2. Start a new Cursor chat
3. Start with: "Read PRD.md in full before doing anything."
4. Describe the specific thing that went wrong in one sentence
5. Paste only the relevant section of the phase prompt, not the whole thing

## If you need a schema change mid-build

1. Stop. Do not let Cursor alter the schema inline.
2. Write the migration SQL yourself in a new numbered file (`007_...sql`, `008_...sql`)
3. Run it manually against your local DB
4. Tell Cursor: "I have added column X to table Y. Update any affected queries."
