export enum PostStatus {
  draft = "draft",
  scheduled = "scheduled",
  published = "published",
}

export function getPostStatus(
  published: Date | null,
  now = new Date(),
): PostStatus {
  if (!published) {
    return PostStatus.draft;
  }
  if (published > now) {
    return PostStatus.scheduled;
  }
  return PostStatus.published;
}

export function isValidScheduleTime(
  scheduleTime: string | undefined,
  now = new Date(),
) {
  if (!scheduleTime) {
    return false;
  }
  return new Date(scheduleTime) < now;
}
