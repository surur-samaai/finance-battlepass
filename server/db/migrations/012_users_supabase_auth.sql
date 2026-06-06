-- Link Supabase Auth UUID to app user row
ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_id UUID UNIQUE;

-- Email-only users won't have a Google id
ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;

-- Needed for post-login redirect (Phase 11)
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Existing v1 users already onboarded — treat them as complete
UPDATE users SET onboarding_complete = TRUE WHERE supabase_id IS NULL;
