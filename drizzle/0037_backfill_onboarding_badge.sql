-- Pre-grant the onboarding badge (already celebrated) to every user who
-- already satisfies its rule: topics picked + 3 follows + a comment.
-- Without this, established members would "earn" First Steps on their next
-- action and get a nonsensical onboarding confetti wave after deploy. New
-- users (and anyone not yet qualifying) still earn + celebrate it normally.
INSERT INTO "user_badge" ("user_id", "badge_id", "celebrated_at")
SELECT u."id", b."id", CURRENT_TIMESTAMP
FROM "user" u
CROSS JOIN "badge" b
WHERE b."key" = 'onboarding_complete'
  AND cardinality(u."topics") > 0
  AND (SELECT count(*) FROM "follow" f WHERE f."follower_id" = u."id") >= 3
  AND EXISTS (SELECT 1 FROM "comments" c WHERE c."author_id" = u."id")
ON CONFLICT ("user_id", "badge_id") DO NOTHING;
