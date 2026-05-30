# PHASE 11 — Auth Overhaul
# Mode: Plan first, then Agent
# Exit criteria: All auth methods work. Existing user data preserved. Passport.js fully removed.

Read PRD_v2.md Section 4 and PRD.md Section 7 before doing anything. Section 4 of PRD_v2.md overrides Section 7 of PRD.md entirely for auth.

---

Phase 10 is complete. We are replacing the entire auth system. This is the most structurally significant change in v2. Take it carefully.

## Overview of what's changing

| v1 | v2 |
|---|---|
| Passport.js + Google OAuth only | Supabase Auth (email/password + Google OAuth) |
| `connect-pg-simple` session store | Supabase manages sessions |
| Custom `requireAuth` middleware | Supabase server-side JWT verification |
| `sessions` table in DB | Dropped — Supabase handles this |

## Prerequisites — confirm before starting
- [ ] Supabase project already exists (used for DB in v1)
- [ ] Supabase Auth is enabled in the Supabase dashboard
- [ ] Google OAuth provider enabled in Supabase Auth settings (add your Google Client ID + Secret there)
- [ ] Email auth enabled in Supabase Auth settings
- [ ] `SUPABASE_URL` and `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are in `server/.env` and `client/.env`

---

## What to build

### 1. Remove Passport.js entirely
- Uninstall: `passport`, `passport-google-oauth20`, `express-session`, `connect-pg-simple`
- Remove all Passport configuration from `server/src/index.ts`
- Delete `server/src/routes/auth.ts` — it will be replaced
- Drop the `sessions` table: create migration `011_drop_sessions.sql`:
```sql
DROP TABLE IF EXISTS "session";
```

### 2. Install Supabase clients
- Backend: `@supabase/supabase-js` (use service role key for admin operations)
- Frontend: `@supabase/supabase-js` (use anon key)
- Create `server/src/lib/supabase.ts` — exports a Supabase admin client (service role key)
- Create `client/src/lib/supabase.ts` — exports a Supabase browser client (anon key)

### 3. New `requireAuth` middleware
Replace the old session-based middleware in `server/src/middleware/requireAuth.ts`:
- Extract the Bearer token from the `Authorization` header
- Verify it using `supabaseAdmin.auth.getUser(token)`
- If valid: attach `req.user = { id: user.id, email: user.email }` and call `next()`
- If invalid or missing: return `401 { "error": "Unauthorized" }`
- Wire to all `/api/*` routes as before

### 4. New auth routes (replace the old ones)
Create `server/src/routes/auth.ts` with:

- `GET /auth/me` — calls `supabaseAdmin.auth.getUser()` with the token from the request. Returns `{ id, email, name }` or 401.

> Note: Sign up, sign in, Google OAuth, forgot password, and reset password are all handled directly by the Supabase JS client on the frontend. The backend does not need routes for these.

### 5. Frontend auth flow

Replace the existing auth logic in the frontend entirely.

**`client/src/lib/supabase.ts`:**
```typescript
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

**`client/src/hooks/useAuth.ts`** (rewrite):
- On mount: call `supabase.auth.getSession()` to check for existing session
- Subscribe to `supabase.auth.onAuthStateChange` to react to login/logout
- Expose: `{ user, session, loading, signOut }`
- `signOut` calls `supabase.auth.signOut()`

**`client/src/pages/Auth.tsx`** (new page, replaces the old login screen):

Two modes on one page — toggled by a tab or link: "Sign In" and "Create Account".

Sign In form:
- Email input
- Password input
- "Remember me" checkbox — if checked, call `supabase.auth.signInWithPassword({ email, password, options: { persistSession: true } })`
- "Forgot password?" link → shows a separate inline panel (not a new page) with an email input and "Send reset link" button
- "Continue with Google" button → calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
- On success: check `onboarding_complete` — if false, redirect to `/onboarding`. If true, redirect to `/dashboard`.

Create Account form:
- Email input
- Password input (with basic strength indicator — at least 8 characters, shown inline)
- "Continue with Google" button (same as sign in)
- On email signup success: Supabase sends a verification email. Show a "Check your email" message on the same page. Do not redirect yet.
- On Google signup: same onboarding check as sign in.

Forgot Password (inline panel, not a separate route):
- Email input + "Send reset link" button
- Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'http://localhost:5173/reset-password' })`
- Show "Reset link sent" confirmation inline

**`client/src/pages/ResetPassword.tsx`** (new page at `/reset-password`):
- Supabase puts the reset token in the URL hash — `supabase.auth.onAuthStateChange` will fire with event `PASSWORD_RECOVERY`
- Show a "New password" input and "Confirm password" input
- On submit: call `supabase.auth.updateUser({ password: newPassword })`
- On success: redirect to `/` (sign in page)
- On error: show error inline

### 6. Attach Supabase user ID to existing users table

The `users` table currently uses an auto-increment `id`. Supabase Auth uses UUIDs. You need to link them.

Create migration `012_users_supabase_id.sql`:
```sql
ALTER TABLE users ADD COLUMN supabase_id UUID UNIQUE;
```

Update the user lookup in `requireAuth` middleware to query `users` by `supabase_id` instead of session.

On first login (both email and Google), if no `users` row exists for this `supabase_id`, auto-create one (same as the v1 first-login logic, now triggered in the middleware or a dedicated `ensureUser` service function).

### 7. Update all API calls in the frontend

All `axios` calls in `client/src/api/` must now include the Supabase session token in the Authorization header:
```typescript
const { data: { session } } = await supabase.auth.getSession()
headers: { Authorization: `Bearer ${session?.access_token}` }
```

Create a shared `apiClient.ts` that wraps axios and injects this header automatically, so you don't add it to every individual call.

## Rules
- Do not use `localStorage` for tokens. Supabase handles persistence.
- Do not build custom JWT logic. Use Supabase's verification.
- The Google OAuth callback is handled by Supabase — do not create a custom `/auth/google/callback` route.
- Existing user data in the `users` table must be preserved. Do not truncate or drop the table.

## Exit criteria — do not move to Phase 12 until all pass
- [ ] Can create a new account with email + password
- [ ] Verification email is sent on signup (check Supabase dashboard logs if not in inbox)
- [ ] Can sign in with email + password
- [ ] "Remember me" keeps the session alive after closing and reopening the browser
- [ ] Google OAuth sign in works end to end
- [ ] Forgot password sends a reset email
- [ ] Reset password link lands on `/reset-password` and successfully updates the password
- [ ] All `/api/*` routes return 401 without a valid Supabase token (test in Postman)
- [ ] All `/api/*` routes work correctly with a valid token in the Authorization header
- [ ] Sign out clears the session and returns to the auth page
- [ ] No references to Passport.js remain anywhere in the codebase
- [ ] `sessions` table is dropped from the DB
- [ ] Existing user data is intact
