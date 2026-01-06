-- Migration 0014: Create Users for Feed Sources
-- Converts scripts/create-source-users.ts to pure SQL
-- Each feed source without a user gets a linked user profile for RSS article attribution

-- ============================================
-- PART 1: Create users for feed sources without user_id
-- ============================================

-- This DO block creates users for all feed sources that lack one
-- and immediately links them back to the feed source
DO $$
DECLARE
    source_record RECORD;
    new_user_id TEXT;
    safe_username TEXT;
    safe_email TEXT;
    existing_user_id TEXT;
BEGIN
    -- Loop through all feed sources without a linked user
    FOR source_record IN
        SELECT
            id,
            name,
            slug,
            logo_url,
            website_url,
            description
        FROM feed_sources
        WHERE user_id IS NULL
    LOOP
        -- Create unique email for this source (used for idempotency check)
        safe_email := 'source-' || source_record.id || '@feeds.codu.co';

        -- Check if user with this email already exists (idempotency)
        SELECT id INTO existing_user_id FROM "user" WHERE email = safe_email LIMIT 1;

        IF existing_user_id IS NOT NULL THEN
            -- User already exists, just link it if not already linked
            UPDATE feed_sources
            SET user_id = existing_user_id
            WHERE id = source_record.id AND user_id IS NULL;

            RAISE NOTICE 'Linked existing user % to feed source % (%)', existing_user_id, source_record.id, source_record.name;
        ELSE
            -- Generate a unique user ID
            new_user_id := gen_random_uuid()::TEXT;

            -- Create safe username from slug or name (max 40 chars total)
            safe_username := 'source-' || COALESCE(
                source_record.slug,
                LOWER(REGEXP_REPLACE(source_record.name, '[^a-zA-Z0-9]', '-', 'g'))
            );
            safe_username := LEFT(safe_username, 40);

            -- Insert the new user
            INSERT INTO "user" (
                id,
                username,
                name,
                email,
                image,
                bio,
                "websiteUrl",
                "emailNotifications",
                newsletter,
                "createdAt",
                "updatedAt"
            ) VALUES (
                new_user_id,
                safe_username,
                source_record.name,
                safe_email,
                COALESCE(source_record.logo_url, '/images/person.png'),
                COALESCE(LEFT(source_record.description, 200), 'Content from ' || source_record.name),
                COALESCE(source_record.website_url, ''),
                FALSE,  -- No email notifications for source users
                FALSE,  -- No newsletter for source users
                NOW(),
                NOW()
            );

            -- Link the feed source to this user
            UPDATE feed_sources
            SET user_id = new_user_id
            WHERE id = source_record.id;

            RAISE NOTICE 'Created user % for feed source % (%)', new_user_id, source_record.id, source_record.name;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- PART 2: Handle username conflicts
-- ============================================

-- If there are any username conflicts from multiple sources with same name,
-- make them unique by appending source ID
UPDATE "user" u
SET username = u.username || '-' || (
    SELECT fs.id::TEXT FROM feed_sources fs WHERE fs.user_id = u.id LIMIT 1
)
WHERE u.email LIKE 'source-%@feeds.codu.co'
AND EXISTS (
    SELECT 1 FROM "user" u2
    WHERE u2.username = u.username
    AND u2.id != u.id
);

-- ============================================
-- PART 3: Summary (for logging)
-- ============================================

DO $$
DECLARE
    total_sources INTEGER;
    linked_sources INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_sources FROM feed_sources;
    SELECT COUNT(*) INTO linked_sources FROM feed_sources WHERE user_id IS NOT NULL;

    RAISE NOTICE 'Migration 0014 complete: % of % feed sources now have linked users', linked_sources, total_sources;
END $$;
