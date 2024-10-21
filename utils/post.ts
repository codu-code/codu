const SCHEDULED = "scheduled" as const;
const PUBLISHED = "published" as const;
const DRAFT = "draft" as const;

export type PostStatus = typeof SCHEDULED | typeof PUBLISHED | typeof DRAFT;

export const status = {
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
