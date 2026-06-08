"use client";

import Link from "next/link";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import { api } from "@/server/trpc/react";
import DiscussionArea from "@/components/Discussion/DiscussionArea";
import { ensureHttps, getHostname, safeExternalHref } from "@/utils/url";
import {
  ContentDetailLayout,
  ContentTypeBadge,
  ContentMetaHeader,
  UnifiedActionBar,
  SourceInfoCard,
} from "@/components/ContentDetail";

type Props = {
  sourceSlug: string;
  shortId: string;
};

const FeedArticlePage = ({ sourceSlug, shortId }: Props) => {
  const { data: article, status } = api.feed.getBySlugAndShortId.useQuery({
    sourceSlug,
    shortId,
  });

  const { data: discussionCount } =
    api.discussion.getContentDiscussionCount.useQuery(
      { contentId: article?.id ?? "" },
      { enabled: !!article?.id },
    );

  const { mutate: trackClick } = api.feed.trackClick.useMutation();

  const handleExternalClick = () => {
    if (article) {
      trackClick({ articleId: article.id });
    }
  };

  if (status === "pending") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-24 rounded bg-inset" />
          <div className="mb-4 h-4 w-48 rounded bg-inset" />
          <div className="mb-2 h-8 w-full rounded bg-inset" />
          <div className="mb-4 h-8 w-3/4 rounded bg-inset" />
          <div className="mb-6 h-20 w-full rounded bg-inset" />
          <div className="h-12 w-full rounded bg-inset" />
        </div>
      </div>
    );
  }

  if (status === "error" || !article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/feed"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
        >
          Back to Feed
        </Link>
        <div className="bg-danger/12 rounded-lg border border-danger/30 p-6 text-center">
          <h1 className="text-lg font-semibold text-danger">Post Not Found</h1>
          <p className="mt-2 text-sm text-danger">
            This post may have been removed or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const hostname = article.externalUrl
    ? getHostname(article.externalUrl)
    : null;
  // Guard against javascript:/data: schemes in externally-sourced URLs.
  const safeExternalUrl = safeExternalHref(article.externalUrl);
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/feed/${sourceSlug}/${shortId}`
      : `/feed/${sourceSlug}/${shortId}`;

  return (
    <ContentDetailLayout
      breadcrumbs={[
        { label: "Feed", href: "/feed" },
        {
          label: article.source?.name || sourceSlug,
          href: `/feed/${sourceSlug}`,
        },
      ]}
      actionBar={
        <UnifiedActionBar
          contentType="article"
          contentId={article.id}
          initialUpvotes={article.upvotes}
          initialDownvotes={article.downvotes}
          initialUserVote={article.userVote}
          initialBookmarked={article.isBookmarked}
          discussionCount={discussionCount ?? 0}
          shareUrl={shareUrl}
          shareTitle={article.title}
        />
      }
      sideInfo={
        article.source && (
          <SourceInfoCard
            name={article.source.name}
            slug={article.source.slug}
            description={article.source.description}
            logo={article.source.logoUrl}
            websiteUrl={article.source.websiteUrl}
          />
        )
      }
      discussion={<DiscussionArea contentId={article.id} />}
    >
      <div className="mb-3">
        <ContentTypeBadge type="link" />
      </div>

      <ContentMetaHeader
        publishedAt={article.publishedAt}
        externalUrl={article.externalUrl}
        source={
          article.source
            ? {
                name: article.source.name,
                slug: article.source.slug,
                logo: article.source.logoUrl,
                websiteUrl: article.source.websiteUrl,
                author: article.sourceAuthor,
              }
            : undefined
        }
      />

      <h1 className="mb-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-fg md:text-3xl">
        {article.title}
      </h1>

      {article.excerpt && <p className="mb-4 text-muted">{article.excerpt}</p>}

      {ensureHttps(article.imageUrl) && (
        <a
          href={safeExternalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleExternalClick}
          className="relative mb-4 block overflow-hidden rounded-lg"
        >
          <img
            src={ensureHttps(article.imageUrl)!}
            alt=""
            className="w-full object-cover transition-opacity hover:opacity-90"
            style={{ maxHeight: "400px" }}
          />
          <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
            <ArrowTopRightOnSquareIcon className="mr-1 inline h-3.5 w-3.5" />
            {hostname}
          </div>
        </a>
      )}

      {safeExternalUrl && (
        <a
          href={safeExternalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleExternalClick}
          className="primary-button flex items-center justify-center gap-2"
        >
          <ArrowTopRightOnSquareIcon className="h-5 w-5" />
          Read Full Article at {hostname}
        </a>
      )}
    </ContentDetailLayout>
  );
};

export default FeedArticlePage;
