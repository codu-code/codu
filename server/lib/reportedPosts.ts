// Open reports on a post reach the admin queue from two tables: member reports
// in the legacy `content_report`, and system (auto-flagged) reports raised by
// the nightly review cron in `reports`. Each table has its own serial id
// sequence, so the two sets of ids are kept in separate fields and never mixed.
// No db/next imports — safe to use from any layer.

export type PostReportRow = {
  reportId: number;
  reason: string;
  details: string | null;
  reportCreatedAt: string;
  postId: string;
  title: string;
  slug: string;
  authorId: string;
  authorUsername: string | null;
  authorName: string | null;
};

export type ReportedPost = {
  id: string;
  title: string;
  slug: string;
  authorId: string;
  authorUsername: string | null;
  authorName: string | null;
  reportCount: number;
  /** `content_report` ids (member reports). */
  reportIds: number[];
  /** `reports` ids (system reports). */
  systemReportIds: number[];
  latestReason: string;
  latestDetails: string | null;
  latestReportAt: string;
};

/**
 * `reports.reason` is the lowercase twin of the legacy `content_report` enum;
 * the admin UI keys its reason labels by the legacy (uppercase) form.
 */
export function toLegacyReason(reason: string): string {
  return reason.toUpperCase();
}

/**
 * Group open reports by post. Posts are ordered by their most recent report,
 * which also supplies the headline reason/details.
 */
export function groupReportedPosts(
  memberRows: PostReportRow[],
  systemRows: PostReportRow[],
): ReportedPost[] {
  const rows = [
    ...memberRows.map((row) => ({ ...row, system: false })),
    ...systemRows.map((row) => ({ ...row, system: true })),
  ].sort(
    (a, b) => Date.parse(b.reportCreatedAt) - Date.parse(a.reportCreatedAt),
  );

  const byPost = new Map<string, ReportedPost>();

  for (const row of rows) {
    let post = byPost.get(row.postId);
    if (!post) {
      post = {
        id: row.postId,
        title: row.title,
        slug: row.slug,
        authorId: row.authorId,
        authorUsername: row.authorUsername,
        authorName: row.authorName,
        reportCount: 0,
        reportIds: [],
        systemReportIds: [],
        latestReason: toLegacyReason(row.reason),
        latestDetails: row.details,
        latestReportAt: row.reportCreatedAt,
      };
      byPost.set(row.postId, post);
    }
    post.reportCount += 1;
    (row.system ? post.systemReportIds : post.reportIds).push(row.reportId);
  }

  return Array.from(byPost.values());
}
