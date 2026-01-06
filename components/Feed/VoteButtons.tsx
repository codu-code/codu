"use client";

import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { signIn, useSession } from "next-auth/react";

type Props = {
  upvotes: number;
  downvotes: number;
  userVote: "up" | "down" | null;
  onVote: (voteType: "up" | "down" | null) => void;
  isLoading?: boolean;
};

const VoteButtons = ({
  upvotes,
  downvotes,
  userVote,
  onVote,
  isLoading = false,
}: Props) => {
  const { data: session } = useSession();
  const score = upvotes - downvotes;

  const handleVote = (voteType: "up" | "down") => {
    if (!session) {
      signIn();
      return;
    }
    // Toggle off if clicking the same vote, otherwise set to new vote
    onVote(userVote === voteType ? null : voteType);
  };

  return (
    <div className="flex items-center gap-1" data-testid="vote-buttons">
      <button
        onClick={() => handleVote("up")}
        disabled={isLoading}
        className={`rounded p-1 transition-colors hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-700 ${
          userVote === "up" ? "text-orange-500" : "text-neutral-400"
        }`}
        aria-label="Upvote"
        data-testid="vote-up-button"
      >
        <ChevronUpIcon className="h-6 w-6" />
      </button>
      <span
        className={`min-w-[2rem] text-center font-medium ${
          score > 0
            ? "text-orange-500"
            : score < 0
              ? "text-blue-500"
              : "text-neutral-500"
        }`}
        data-testid="vote-score"
      >
        {score}
      </span>
      <button
        onClick={() => handleVote("down")}
        disabled={isLoading}
        className={`rounded p-1 transition-colors hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-700 ${
          userVote === "down" ? "text-blue-500" : "text-neutral-400"
        }`}
        aria-label="Downvote"
        data-testid="vote-down-button"
      >
        <ChevronDownIcon className="h-6 w-6" />
      </button>
    </div>
  );
};

export default VoteButtons;
