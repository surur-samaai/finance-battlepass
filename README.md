# Cursor Prompts — Budgt Hero

One prompt file per phase. Use them in order. Do not skip ahead.

## How to use each prompt

1. Open Cursor
2. Switch to **Plan mode** (except Phase 10 and Phase 16 which go straight to Agent)
3. Paste the full contents of the phase file
4. Review Cursor's plan — if anything contradicts PRD.md or PRD_v2.md, correct it before proceeding
5. Switch to **Agent mode** and let it build
6. Manually verify every exit criteria checkbox before moving to the next phase
7. **Commit to Git** before starting the next phase

---

## Phase index

### v1 Phases (complete)
| File | Phase | Status |
|---|---|---|
| `PHASE_1_FOUNDATION.md` | Foundation | ✅ Done |
| `PHASE_2_GAME_LOGIC_ENGINE.md` | Game Logic Engine | ✅ Done |
| `PHASE_3_FRONTEND_SHELL.md` | Frontend Shell | ✅ Done |
| `PHASE_4_WIRE_UP.md` | Wire Up | ✅ Done |
| `PHASE_5_AUTH.md` | Auth (Passport.js) | ✅ Done — replaced in Phase 11 |
| `PHASE_6_VAULT_WISHLIST.md` | Vault & Wishlist | ✅ Done |
| `PHASE_7_GULAG_UI.md` | Gulag UI | ✅ Done — renamed in Phase 10 |
| `PHASE_8_SEASON_RESET.md` | Season Reset | ✅ Done |
| `PHASE_9_POLISH_DEPLOY.md` | Polish & Deploy | ✅ Done |

### v2 Phases (current)
| File | Phase | Key output |
|---|---|---|
| `PHASE_10_REBRAND.md` | Rebrand | All v1 names replaced with Budgt Hero naming system |
| `PHASE_11_AUTH_OVERHAUL.md` | Auth Overhaul | Supabase Auth, email/password, Google, remember me, password reset |
| `PHASE_12_ONBOARDING_REDESIGN.md` | Onboarding | 5-step onboarding, character name, Stitch placeholder |
| `PHASE_13_BUDGTEER_CHARACTER.md` | Budgteer Character | DiceBear avatar, Gem economy, cosmetic shop backend |
| `PHASE_14_STITCH_INTEGRATION.md` | Stitch Integration | Open Banking, real transactions, automatic quest tracking, cron job |
| `PHASE_15_SHOP_V2.md` | The Shop v2 | Budgteer Shop tab, cosmetics purchase, avatar updates live |
| `PHASE_16_POLISH_REDEPLOY.md` | Polish & Redeploy | Full v2 polish, Railway + Vercel redeployment, README |

---

## If Cursor goes off-script
1. Do not argue in the same session — start a new chat
2. Start with: "Read PRD_v2.md and PRD.md before doing anything."
3. Describe the specific problem in one sentence
4. Paste only the relevant section of the phase prompt

## If you need a schema change mid-build
1. Stop. Do not let Cursor alter the schema inline.
2. Write the migration SQL yourself (next number in sequence)
3. Run it manually against the DB
4. Tell Cursor: "I have added column X to table Y. Update any affected queries."

## Migration file sequence
- 001–007: v1 migrations (complete)
- 008: character columns on users
- 009: shop_items + user_shop_items
- 010: bank_connections
- 011: drop sessions table
- 012: supabase_id on users
- Next: 013_...sql
