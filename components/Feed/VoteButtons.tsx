"use client";

import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { signIn, useSession } from "next-auth/react";

type Props = {
  upvotes: number;
  downvotes: number;
  userVote: "UP" | "DOWN" | null;
  onVote: (voteType: "UP" | "DOWN" | null) => void;
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

  const handleVote = (voteType: "UP" | "DOWN") => {
    if (!session) {
      signIn();
      return;
    }
    // Toggle off if clicking the same vote, otherwise set to new vote
    onVote(userVote === voteType ? null : voteType);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote("UP")}
        disabled={isLoading}
        className={`rounded p-1 transition-colors hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-700 ${
          userVote === "UP" ? "text-orange-500" : "text-neutral-400"
        }`}
        aria-label="Upvote"
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
      >
        {score}
      </span>
      <button
        onClick={() => handleVote("DOWN")}
        disabled={isLoading}
        className={`rounded p-1 transition-colors hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-700 ${
          userVote === "DOWN" ? "text-blue-500" : "text-neutral-400"
        }`}
        aria-label="Downvote"
      >
        <ChevronDownIcon className="h-6 w-6" />
      </button>
    </div>
  );
};

export default VoteButtons;
