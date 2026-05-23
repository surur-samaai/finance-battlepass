# PHASE 9 — Polish & Deploy
# Mode: Agent (no planning needed — tasks are discrete and independent)
# Exit criteria: App live on a public URL. Shareable in portfolio.

Read PRD.md in full before doing anything. It is the single source of truth. Do not contradict it.

---

Phase 8 is complete. The full app is functionally done. This phase is polish and deployment only. Do not add features. Do not change game logic or DB schema.

Work through these tasks in order. Commit after each one.

---

## Task 1 — XP bar animation

The XP bar fill should animate smoothly when XP increases after a quest or webhook.
- Use a CSS transition on the `width` property: `transition: width 600ms ease-out`
- The bar should animate from its previous value to the new value, not jump
- Implement this in `XPBar.tsx` using a `useEffect` that watches the `currentXP` prop

---

## Task 2 — State badge pulse animation

When `user.state === 'GULAG'`, the red state badge must pulse.
- Use Tailwind's `animate-pulse` class
- The pulse should stop when state returns to `ACTIVE`

---

## Task 3 — Wishlist item glow

Affordable wishlist items (user has enough tokens) should have a subtle glow effect.
- Use `box-shadow` with the primary accent colour at low opacity: `0 0 12px rgba(74, 144, 217, 0.4)`
- Apply on hover: increase opacity to `0.7`
- Implement via Tailwind custom utility or inline style — your choice

---

## Task 4 — Toast animation

Toasts should slide in from the bottom-right and fade out on dismiss.
- Slide in: `translateY(20px) → translateY(0)` with `opacity 0 → 1` over 200ms
- Fade out: `opacity 1 → 0` over 150ms before removal from DOM
- Implement with CSS keyframes in `index.css` and apply via className in `Toast.tsx`

---

## Task 5 — Empty states

Add empty state UI for:
- Vault with no wishlist items: show text "Your Vault is empty. Add items to start earning towards them." with an "Add Item" button
- No active quests: show "No active quests. Your Loadout is empty." — for MVP this is informational only
- Season history with no previous seasons: show "No previous seasons. Complete your first month to see stats here."

---

## Task 6 — Responsive layout

The app must be usable on a tablet screen (768px wide minimum). It does not need to be a perfect mobile experience — portfolio reviewers will mostly view it on desktop.

- Sidebar nav collapses to a top bar at `< 768px`
- Vault grid goes from 3 columns to 2 columns at `< 1024px`
- Dashboard XP bar and stats stack vertically at `< 768px`

Use Tailwind responsive prefixes (`md:`, `lg:`) only. No new layout libraries.

---

## Task 7 — Environment config cleanup

Before deploying, audit all environment variables:
- [ ] `server/.env.example` is up to date with every var used in the codebase
- [ ] No secrets or API keys are in any file that is not `.gitignored`
- [ ] `SKIP_AUTH` env var has been fully removed (completed in Phase 5 — verify)
- [ ] `NODE_ENV` is used to toggle `cookie.secure` (false in dev, true in production)
- [ ] `VITE_API_URL` in the client points to the production backend URL in the production build

---

## Task 8 — Deploy backend to Railway

1. Create a new Railway project
2. Add a PostgreSQL plugin — Railway will provide a `DATABASE_URL`
3. Run all migration files against the Railway DB (Railway console or a one-time migration script)
4. Set all required environment variables in Railway dashboard (copy from `.env.example`)
5. Set `NODE_ENV=production` and `SESSION_SECRET` to a strong random string
6. Update the Google OAuth callback URL in Google Cloud Console to the Railway production URL: `https://<your-railway-domain>/auth/google/callback`
7. Deploy. Verify `GET /health` returns `{ "status": "ok" }` on the live URL.

---

## Task 9 — Deploy frontend to Vercel

1. Connect your GitHub repo to Vercel
2. Set `VITE_API_URL` to your Railway backend URL
3. Set the build command to `npm run build` and output directory to `dist`
4. Deploy
5. Verify the app loads, Google login works, and the full loop (webhook → XP change → Gulag → reset) works on the live URL

---

## Task 10 — Final portfolio checks

Before sharing the URL:
- [ ] The app works fully on a fresh login (no leftover state from dev testing in the DB)
- [ ] DevToolsPanel is visible and functional — this is a feature for portfolio reviewers, not a bug
- [ ] Season history shows at least one archived season (run a reset before sharing)
- [ ] No console errors in the browser on any page
- [ ] No broken layouts at 1280px wide (standard laptop)
- [ ] README.md exists at the project root explaining: what the app is, the tech stack, how to run it locally, and a link to the live demo

---

## Exit criteria — this is the final phase
- [ ] App is live on a public URL
- [ ] Google OAuth works on the live URL
- [ ] Full game loop works end to end on the live deployment
- [ ] README.md is written and accurate
- [ ] No secrets in the Git history
