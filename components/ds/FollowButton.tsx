"use client";

import { clsx } from "clsx";
import { api } from "@/server/trpc/react";

/** Follow / Following toggle. Render only for signed-in, non-owner viewers. */
export function FollowButton({ userId }: { userId: string }) {
  const utils = api.useUtils();
  const { data: isFollowing, isLoading } = api.follow.isFollowing.useQuery(
    { userId },
    { retry: false },
  );

  const onSettled = async () => {
    await Promise.all([
      utils.follow.isFollowing.invalidate({ userId }),
      utils.follow.counts.invalidate({ userId }),
    ]);
  };

  const followMut = api.follow.follow.useMutation({ onSettled });
  const unfollowMut = api.follow.unfollow.useMutation({ onSettled });
  const pending = followMut.isPending || unfollowMut.isPending;

  const toggle = () => {
    if (pending) return;
    if (isFollowing) unfollowMut.mutate({ userId });
    else followMut.mutate({ userId });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isLoading || pending}
      aria-pressed={!!isFollowing}
      className={clsx(
        "rounded-full px-5 py-1.5 text-sm font-semibold transition-colors disabled:opacity-60",
        isFollowing
          ? "border border-hairline text-fg hover:border-accent/50"
          : "bg-accent text-on-accent hover:bg-accent-soft",
      )}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
