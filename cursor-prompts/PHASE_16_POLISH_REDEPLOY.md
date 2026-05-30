# PHASE 16 — Polish & Redeploy
# Mode: Agent (tasks are discrete — no planning needed)
# Exit criteria: Live URL reflects all v2 changes. Fully shareable as a portfolio project.

Read PRD_v2.md and PRD.md before doing anything.

---

Phase 15 is complete. The app is functionally done. This phase is polish, cleanup, and redeployment. Work through tasks in order. Commit after each one.

---

## Task 1 — Auth page visual polish

The auth page is the first thing anyone sees. Make it count.
- Full-viewport dark background
- Budgt Hero logo/wordmark centred (text-based is fine — use the accent colour and a large bold font)
- A one-line tagline beneath: "Level up your spending. One season at a time."
- The sign in / create account form centred, max-width 400px, card-style with a subtle border
- Google OAuth button styled distinctly from the email form (use the Google brand colour `#4285F4` or white with a Google icon)
- Smooth tab transition between Sign In and Create Account (CSS transition, no library)

---

## Task 2 — Dashboard polish

- Budgteer card: add a subtle card background behind the avatar + name + XP bar. Should feel like a character profile panel.
- XP bar: animated fill on load and on XP change (already done in Phase 9 — verify it still works)
- State badge: verify `ACTIVE` (green), `BUDGT_BREAK` (red, pulsing), `RECOVERY` (amber) all render correctly
- Quest cards: add a subtle left-border accent colour per quest type (Daily = blue, Weekly = purple, Recovery = amber)
- Empty quest state: "No active quests this season." — should not be an unstyled blank area

---

## Task 3 — Onboarding polish

- Step indicator at the top (dots, numbered, or progress bar — pick one and make it look intentional)
- Smooth step transition (slide or fade — CSS only, no library)
- The avatar preview in Step 4 should feel like a character creation screen — give it a card background, centred, with the customisation swatches below it
- "Start my Season" button in Step 5 should feel like a moment — make it large, full-width, with the accent colour

---

## Task 4 — The Shop polish

- Tab switcher should have a clear active state (underline or filled pill)
- Wishlist and Budgteer Shop grids should have consistent card sizing
- Gem and Coin icons: use a simple SVG or emoji (💎 for Gems, 🪙 for Coins) consistently across the entire app — header, shop cards, quest rewards
- "UNLOCKED" stamp on purchased wishlist items: make it feel like a rubber stamp (rotated slightly, bold, accent-coloured border)

---

## Task 5 — Responsive layout check

Test at three widths: 1280px (desktop), 768px (tablet), 375px (mobile).
- At 768px: sidebar collapses, layout stacks correctly
- At 375px: the app should be usable even if not perfectly designed for mobile
- Fix any obvious layout breaks. Do not redesign for mobile — just prevent it from being broken.

---

## Task 6 — Environment and secrets audit

- [ ] All env vars in `server/.env.example` and `client/.env.example` are up to date
- [ ] `STITCH_CLIENT_ID`, `STITCH_CLIENT_SECRET`, `STITCH_WEBHOOK_SECRET` are in `.env.example` with placeholder values and comments
- [ ] `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are documented
- [ ] No secrets appear anywhere in committed code or `.env` files tracked by git
- [ ] `.gitignore` covers all `.env` files

---

## Task 7 — Update Railway deployment (backend)

- Update all environment variables in Railway dashboard to include new v2 vars (Stitch, Supabase service role key)
- Run all new migrations (`008` through `012`) against the Railway production DB
- Run the shop items seed file against the Railway production DB
- Update the Stitch dashboard webhook URL to the Railway production URL
- Update the Stitch dashboard callback URL to the Railway production URL
- Deploy. Verify `GET /health` returns 200.

---

## Task 8 — Update Vercel deployment (frontend)

- Update all environment variables in Vercel dashboard (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`)
- Update the Supabase Auth settings: add the Vercel production URL to the allowed redirect URLs
- Update Google OAuth settings in Supabase Auth: add the production URL as an authorised redirect
- Deploy. Verify the full auth flow works on the live URL.

---

## Task 9 — End-to-end test on live URL

Test the complete user journey on the deployed app (not localhost):
- [ ] Sign up with email → verification email arrives → verify → land on onboarding
- [ ] Complete all 5 onboarding steps → land on dashboard
- [ ] Dashboard shows Budgteer avatar, name, XP bar, quests
- [ ] Complete a manual quest (for users without bank connection) → XP updates
- [ ] Navigate to The Shop → Wishlist and Budgteer Shop tabs work
- [ ] Equip a default cosmetic → avatar updates on dashboard without page refresh
- [ ] Sign out → lands on auth page
- [ ] Sign in again → lands directly on dashboard (onboarding not shown again)
- [ ] Forgot password flow works end to end on the live URL

---

## Task 10 — README update

Rewrite `README.md` at the project root:

```markdown
# Budgt Hero

A gamified personal finance app. Build your Budgteer, earn XP by staying on budget, 
and unlock real-world rewards through the Budgt Pass seasonal progression system.

## Features
- Budgteer character creation with DiceBear avatars
- XP and levelling system tied to real spending discipline
- Budgt Pass: monthly seasons with Coin rewards for wishlist items
- Budgt Break: penalty system for impulse spending with a recovery quest
- Gem economy for cosmetic character upgrades
- Open Banking integration via Stitch (FNB, Nedbank, Standard Bank, Absa, Capitec)
- Automatic quest tracking for bank-connected users

## Tech Stack
- Frontend: React (Vite) + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL (Supabase)
- Auth: Supabase Auth (email/password + Google OAuth)
- Banking: Stitch Open Banking API
- Avatars: DiceBear API v9

## Running locally
[include setup steps]

## Live demo
[insert Vercel URL]
```

---

## Exit criteria — this is the final v2 phase
- [ ] Live URL is accessible and loads correctly
- [ ] Full new user journey works end to end on the live URL
- [ ] Auth page looks polished and branded
- [ ] No console errors on any page in production
- [ ] README is accurate and includes the live demo URL
- [ ] No secrets in git history (`git log` shows no .env files committed)
- [ ] App is shareable — you would not be embarrassed to send this URL to a hiring manager
