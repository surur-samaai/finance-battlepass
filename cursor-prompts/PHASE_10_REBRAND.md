# PHASE 10 — Rebrand
# Mode: Agent (no planning needed — this is purely a find-and-replace task)
# Exit criteria: Zero v1 names visible anywhere in the UI. DB unchanged.

Read PRD_v2.md and PRD.md before doing anything. PRD_v2.md Section 2 contains the complete naming system. It is non-negotiable.

---

Phase 9 is complete. This phase has one job: rename every user-facing string in the frontend to the v2 naming system. No logic changes. No new features. No DB changes.

## The Naming Map

| Find (v1) | Replace with (v2) |
|---|---|
| Finance Battle Pass | Budgt Hero |
| Battle Pass | Budgt Pass |
| Gulag | Budgt Break |
| Tokens (wishlist currency) | Coins |
| Wishlist Vault | The Shop |
| Loadout | Profile |
| Character | Budgteer |

## What to change

Search the entire `client/` directory for every instance of each v1 name above. Change:
- All JSX text content and string literals
- All placeholder text in inputs
- All toast message strings (update to match exactly — see PRD.md Section 10, replacing "Gulag" with "Budgt Break")
- All page titles, headings, labels, button text
- All component display names (e.g. `GulagOverlay` → `BudgtBreakOverlay`) — rename the file and the component name
- All route names if any reference v1 names

## What NOT to change
- DB column names — these stay as v1
- API endpoint paths — these stay as v1
- Backend variable names and service names — these stay as v1
- Any comments or internal code strings not visible to the user

## Approach
Do not do a blanket find-and-replace across the whole codebase — this will break DB column references and backend code. Limit changes strictly to `client/src/` only. For any API response field that has a v1 name (e.g. `wishlist_tokens`) that gets displayed in the UI, mask it in the component with a display label — do not rename the field itself.

## Rules
- No logic changes whatsoever.
- No new components or pages.
- No backend changes.
- No DB changes.

## Exit criteria — do not move to Phase 11 until all pass
- [ ] The word "Gulag" appears nowhere in the rendered UI
- [ ] The phrase "Battle Pass" appears nowhere in the rendered UI
- [ ] The word "Tokens" (as a currency label) appears nowhere in the rendered UI — "Coins" is used instead
- [ ] "Wishlist Vault" appears nowhere — "The Shop" is used
- [ ] "Loadout" appears nowhere — "Profile" is used
- [ ] All toast messages use v2 names
- [ ] App still functions identically to the end of Phase 9 — no regressions
- [ ] No DB column names or API endpoint paths have changed
