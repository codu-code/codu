const [SCHEDULED, PUBLISHED, DRAFT] = ["scheduled", "published", "draft"];

export const PostStatus = {
  SCHEDULED,
  PUBLISHED,
  DRAFT,
};

export function getPostStatus(published: Date | null, now = new Date()) {
  if (!published) {
    return DRAFT;
  }
  if (published > now) {
    return SCHEDULED;
  }
  return PUBLISHED;
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
