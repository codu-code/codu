// Shared "post goes live" side-effects, run once when a post becomes published
// (via moderator approve or the promote-scheduled cron): award points, ping
// IndexNow, notify the author. Each effect is guarded so one failure doesn't
// break the others. The caller owns the status='published' DB write.
import * as Sentry from "@sentry/nextjs";

import type { db as Database } from "@/server/db";
import { notification } from "@/server/db/schema";
import { award } from "@/server/lib/engagement";
import { submitToIndexNow } from "@/server/lib/indexnow";
import { POST_APPROVED } from "@/utils/notifications";

const SITE_ORIGIN = "https://www.codu.co";

export interface GoLivePost {
  id: string;
  authorId: string;
  type: string;
  slug: string | null;
  authorUsername: string | null;
  sourceId: number | null;
  canonicalUrl: string | null;
}

// Public canonical URL for a now-live post, or null when there's no stable URL
// or it's not member-originated. Discussions/questions → /d/{slug};
// member articles → /{username}/{slug}.
export function buildCanonicalUrl(post: GoLivePost): string | null {
  // Source-imported and cross-posted rows are not our canonical content.
  if (post.sourceId || post.canonicalUrl) return null;
  if (!post.slug) return null;

  if (post.type === "discussion" || post.type === "question") {
    return `${SITE_ORIGIN}/d/${post.slug}`;
  }
  return post.authorUsername
    ? `${SITE_ORIGIN}/${post.authorUsername}/${post.slug}`
    : null;
}

export async function runPostGoLiveSideEffects(
  db: typeof Database,
  post: GoLivePost,
): Promise<void> {
  // 1. Award publish points, exactly as the normal publish flow does.
  try {
    await award({
      userId: post.authorId,
      action: "post_published",
      sourceType: "post",
      sourceId: post.id,
    });
  } catch (error) {
    Sentry.captureException(error);
  }

  // 2. Ping IndexNow — fire-and-forget, production-guarded inside the lib.
  const url = buildCanonicalUrl(post);
  if (url) void submitToIndexNow(url);

  // 3. Notify the author (notifier = author so the notifier join resolves).
  try {
    await db.insert(notification).values({
      type: POST_APPROVED,
      userId: post.authorId,
      notifierId: post.authorId,
      postId: post.id,
    });
  } catch (error) {
    Sentry.captureException(error);
  }
}
