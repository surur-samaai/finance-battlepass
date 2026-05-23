# PHASE 5 — Authentication
# Mode: Plan first, then Agent
# Exit criteria: App requires Google login. Unauthenticated requests to /api/* return 401.

Read PRD.md in full before doing anything. It is the single source of truth. Do not contradict it.

---

Phase 4 is complete. We are building Phase 5 only. Do not add new features. Do not change game logic or DB schema.

## Prerequisites — confirm before starting
- [ ] Google Cloud project created
- [ ] OAuth 2.0 credentials configured (Client ID + Client Secret)
- [ ] Authorised redirect URI set to `http://localhost:3000/auth/google/callback`
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` added to `server/.env`

---

## What to build

### 1. Backend — Passport.js + Google OAuth

Install: `passport`, `passport-google-oauth20`, `express-session`, `connect-pg-simple`

In `server/src/index.ts`:
- Configure `express-session` with:
  - `secret` from env var `SESSION_SECRET`
  - `resave: false`
  - `saveUninitialized: false`
  - `store`: a `connect-pg-simple` instance using the existing `pg` pool
  - `cookie: { secure: false }` for local dev (set to `true` in production)
- Initialise Passport after session middleware

In `server/src/routes/auth.ts` (replace stubs):
- `GET /auth/google` — triggers Google OAuth flow with scopes `['profile', 'email']`
- `GET /auth/google/callback` — handles callback:
  - On first login: create a new row in `users` table using `google_id`, `email`, `username` from Google profile
  - On returning login: look up existing user by `google_id`
  - Store `userId` in session
  - On success: redirect to `http://localhost:5173` (the Vite dev server)
  - On failure: redirect to `/auth/error`
- `GET /auth/logout` — destroys session, redirects to `http://localhost:5173`
- `GET /auth/me` — returns `{ id, username, email }` for the logged-in user, or 401 if not authenticated. The frontend uses this to check login state on load.

### 2. Update `requireAuth` middleware

Remove the `SKIP_AUTH` bypass. The middleware must now:
- Check `req.session.userId` exists
- If yes: attach user to `req.user` (fetch from DB by ID) and call `next()`
- If no: return `401 { "error": "Unauthorized" }`

### 3. Replace hardcoded `userId = 1` in all routes

Search for every `TODO: replace with session user ID after Phase 5` comment placed in Phase 4. Replace each hardcoded `userId = 1` with `req.user.id` from the session.

### 4. Frontend — auth flow

Create `client/src/hooks/useAuth.ts`:
- On app mount, calls `GET /auth/me`
- If 200: user is logged in, store user in state
- If 401: user is not logged in

In `client/src/App.tsx`:
- Wrap routes in an auth check using `useAuth`
- If not logged in: show a simple login screen with a "Sign in with Google" button that links to `http://localhost:3000/auth/google`
- If logged in: render the app normally
- Show a loading state while `GET /auth/me` is in flight — do not flash the login screen briefly before redirecting

Replace the hardcoded `userId = 1` in all API calls with the real user ID from `useAuth`.

Add a logout button in the nav that calls `GET /auth/logout` and clears local auth state.

### 5. Session table migration

Create `server/db/migrations/006_sessions.sql`:
```sql
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
```
Run this migration before testing.

## Rules
- Do not change game logic, DB schema (except the sessions table), or UI layout.
- Do not use JWTs. Session-based auth only, as per PRD.md Section 7.
- Do not store anything sensitive in `localStorage`.
- All `passport` usage must use current non-deprecated APIs.

## Exit criteria — do not move to Phase 6 until all of these pass
- [ ] Visiting the app when logged out shows the login screen
- [ ] Clicking "Sign in with Google" completes the OAuth flow and redirects back to the app
- [ ] After login, `GET /auth/me` returns the correct user data
- [ ] All `/api/*` routes return 401 when called without a valid session (test in Postman with no cookie)
- [ ] All `/api/*` routes work correctly with a valid session cookie
- [ ] Clicking logout destroys the session and returns to the login screen
- [ ] A second Google account logging in creates a separate user row — they do not share state
- [ ] No `SKIP_AUTH` env var remains in the codebase
