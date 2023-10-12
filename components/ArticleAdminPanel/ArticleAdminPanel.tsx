"use client";

import { useRouter } from "next/navigation";
import { api } from "@/server/trpc/react";

import { type Session } from "next-auth";

interface Props {
  session: Session | null;
  postId: string;
}

const ArticleAdminPanel = ({ session, postId }: Props) => {
  const { mutate: deletePost } = api.post.delete.useMutation();
  const { push } = useRouter();

  const handleDeletePost = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deletePost({ id: postId });
        push("/articles");
      } catch {
        console.error("Something went wrong.");
      }
    }
  };

  return (
    <div className="border-t-2 text-center pb-8">
      <h4 className="text-2xl mb-6 mt-4">Admin Control</h4>
      <button onClick={handleDeletePost} className="secondary-button">
        Delete Post
      </button>
    </div>
  );
};

export default ArticleAdminPanel;
