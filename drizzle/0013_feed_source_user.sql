-- Feed Source User Profile Migration
-- Each RSS feed source gets a linked user profile to serve as the author for aggregated articles

-- Add user_id column to feed_sources table
ALTER TABLE feed_sources ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL;

-- Create index for efficient lookup
CREATE INDEX IF NOT EXISTS feed_sources_user_id_idx ON feed_sources(user_id);
