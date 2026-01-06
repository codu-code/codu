-- Schema Redesign: Posts & Comments
-- This migration creates a clean, unified content system with lowercase naming

-- ============================================
-- PART 1: Extensions and Enum Types
-- ============================================

-- Enable ltree for hierarchical comment paths
CREATE EXTENSION IF NOT EXISTS ltree;

-- Post type enum (lowercase)
DO $$ BEGIN
    CREATE TYPE post_type AS ENUM ('article', 'discussion', 'link', 'resource');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Post status enum
DO $$ BEGIN
    CREATE TYPE post_status AS ENUM ('draft', 'published', 'scheduled', 'unlisted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Vote type enum
DO $$ BEGIN
    CREATE TYPE vote_type AS ENUM ('up', 'down');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Feed source status enum
DO $$ BEGIN
    CREATE TYPE feed_source_status AS ENUM ('active', 'paused', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Report reason enum
DO $$ BEGIN
    CREATE TYPE report_reason AS ENUM ('spam', 'harassment', 'hate_speech', 'misinformation', 'copyright', 'nsfw', 'off_topic', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Report status enum
DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'dismissed', 'actioned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- PART 2: Feed Sources Table
-- ============================================

CREATE TABLE IF NOT EXISTS feed_sources (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    website_url TEXT,
    logo_url TEXT,
    slug VARCHAR(100) UNIQUE,
    category VARCHAR(50),
    description TEXT,
    status feed_source_status DEFAULT 'active' NOT NULL,
    last_fetched_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    error_count INTEGER DEFAULT 0 NOT NULL,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- PART 3: Posts Table
-- ============================================

CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type post_type NOT NULL,

    author_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

    title VARCHAR(500) NOT NULL,
    slug VARCHAR(300) NOT NULL,
    excerpt TEXT,
    body TEXT,
    canonical_url TEXT,
    cover_image TEXT,

    -- For link/resource types (external URLs)
    external_url VARCHAR(2000),

    -- RSS import metadata
    source_id INTEGER REFERENCES feed_sources(id) ON DELETE SET NULL,
    source_author VARCHAR(200),

    -- Metadata
    reading_time INTEGER,

    -- Denormalized counters (updated via triggers)
    upvotes_count INTEGER DEFAULT 0 NOT NULL,
    downvotes_count INTEGER DEFAULT 0 NOT NULL,
    comments_count INTEGER DEFAULT 0 NOT NULL,
    views_count INTEGER DEFAULT 0 NOT NULL,

    -- Publishing
    status post_status NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,

    -- Feature flags
    featured BOOLEAN DEFAULT FALSE NOT NULL,
    pinned_until TIMESTAMPTZ,
    show_comments BOOLEAN DEFAULT TRUE NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Posts indexes
CREATE INDEX IF NOT EXISTS posts_author_id_idx ON posts(author_id);
CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_idx ON posts(slug);
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status);
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts(published_at);
CREATE INDEX IF NOT EXISTS posts_type_idx ON posts(type);
CREATE INDEX IF NOT EXISTS posts_source_id_idx ON posts(source_id);
CREATE INDEX IF NOT EXISTS posts_featured_idx ON posts(featured) WHERE featured = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS posts_external_url_source_idx ON posts(external_url, source_id)
    WHERE external_url IS NOT NULL;

-- ============================================
-- PART 4: Comments Table
-- ============================================

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,

    -- Materialized path for efficient tree queries
    path LTREE NOT NULL,
    depth INTEGER DEFAULT 0 NOT NULL,

    body TEXT NOT NULL,

    -- Denormalized counters
    upvotes_count INTEGER DEFAULT 0 NOT NULL,
    downvotes_count INTEGER DEFAULT 0 NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ  -- Soft delete for "[deleted]" placeholders
);

-- Comments indexes
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
CREATE INDEX IF NOT EXISTS comments_author_id_idx ON comments(author_id);
CREATE INDEX IF NOT EXISTS comments_path_idx ON comments USING GIST(path);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at);

-- ============================================
-- PART 5: Voting Tables
-- ============================================

CREATE TABLE IF NOT EXISTS post_votes (
    id SERIAL PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    vote_type vote_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS post_votes_post_id_idx ON post_votes(post_id);

CREATE TABLE IF NOT EXISTS comment_votes (
    id SERIAL PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    vote_type vote_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS comment_votes_comment_id_idx ON comment_votes(comment_id);

-- ============================================
-- PART 6: Bookmarks Table
-- ============================================

CREATE TABLE IF NOT EXISTS bookmarks (
    id SERIAL PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS bookmarks_post_id_idx ON bookmarks(post_id);

-- ============================================
-- PART 7: Post Tags Junction Table
-- ============================================

CREATE TABLE IF NOT EXISTS post_tags (
    id SERIAL PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES "Tag"(id) ON DELETE CASCADE,
    UNIQUE(post_id, tag_id)
);

CREATE INDEX IF NOT EXISTS post_tags_post_id_idx ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS post_tags_tag_id_idx ON post_tags(tag_id);

-- ============================================
-- PART 8: Reports Table
-- ============================================

CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    reporter_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    reason report_reason NOT NULL,
    details TEXT,
    status report_status DEFAULT 'pending' NOT NULL,
    reviewed_by_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    action_taken TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT reports_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS reports_post_id_idx ON reports(post_id);
CREATE INDEX IF NOT EXISTS reports_comment_id_idx ON reports(comment_id);

-- ============================================
-- PART 9: Triggers for Denormalized Counters
-- ============================================

-- Post vote count trigger
CREATE OR REPLACE FUNCTION update_post_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'up' THEN
            UPDATE posts SET upvotes_count = upvotes_count + 1 WHERE id = NEW.post_id;
        ELSE
            UPDATE posts SET downvotes_count = downvotes_count + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'up' THEN
            UPDATE posts SET upvotes_count = GREATEST(upvotes_count - 1, 0) WHERE id = OLD.post_id;
        ELSE
            UPDATE posts SET downvotes_count = GREATEST(downvotes_count - 1, 0) WHERE id = OLD.post_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' AND OLD.vote_type IS DISTINCT FROM NEW.vote_type THEN
        IF OLD.vote_type = 'up' AND NEW.vote_type = 'down' THEN
            UPDATE posts SET
                upvotes_count = GREATEST(upvotes_count - 1, 0),
                downvotes_count = downvotes_count + 1
            WHERE id = NEW.post_id;
        ELSIF OLD.vote_type = 'down' AND NEW.vote_type = 'up' THEN
            UPDATE posts SET
                upvotes_count = upvotes_count + 1,
                downvotes_count = GREATEST(downvotes_count - 1, 0)
            WHERE id = NEW.post_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_post_vote_counts ON post_votes;
CREATE TRIGGER tr_post_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON post_votes
FOR EACH ROW EXECUTE FUNCTION update_post_vote_counts();

-- Comment vote count trigger
CREATE OR REPLACE FUNCTION update_comment_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'up' THEN
            UPDATE comments SET upvotes_count = upvotes_count + 1 WHERE id = NEW.comment_id;
        ELSE
            UPDATE comments SET downvotes_count = downvotes_count + 1 WHERE id = NEW.comment_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'up' THEN
            UPDATE comments SET upvotes_count = GREATEST(upvotes_count - 1, 0) WHERE id = OLD.comment_id;
        ELSE
            UPDATE comments SET downvotes_count = GREATEST(downvotes_count - 1, 0) WHERE id = OLD.comment_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' AND OLD.vote_type IS DISTINCT FROM NEW.vote_type THEN
        IF OLD.vote_type = 'up' AND NEW.vote_type = 'down' THEN
            UPDATE comments SET
                upvotes_count = GREATEST(upvotes_count - 1, 0),
                downvotes_count = downvotes_count + 1
            WHERE id = NEW.comment_id;
        ELSIF OLD.vote_type = 'down' AND NEW.vote_type = 'up' THEN
            UPDATE comments SET
                upvotes_count = upvotes_count + 1,
                downvotes_count = GREATEST(downvotes_count - 1, 0)
            WHERE id = NEW.comment_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_comment_vote_counts ON comment_votes;
CREATE TRIGGER tr_comment_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON comment_votes
FOR EACH ROW EXECUTE FUNCTION update_comment_vote_counts();

-- Comments count trigger on posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_post_comments_count ON comments;
CREATE TRIGGER tr_post_comments_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- ============================================
-- PART 10: Data Migration (SKIPPED FOR FRESH INSTALL)
-- ============================================
-- Data migration from legacy tables is skipped for fresh installs.
-- Use the seed script (npm run db:seed) to populate data.
-- If migrating from existing data, this section would need to be updated
-- to match the actual legacy table column names.

-- ============================================
-- Done!
-- Old tables are preserved for rollback safety.
-- They can be dropped in a future migration after verification.
-- ============================================
