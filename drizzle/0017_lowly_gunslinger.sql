CREATE TYPE "public"."feed_source_status" AS ENUM('active', 'paused', 'error');--> statement-breakpoint
CREATE TYPE "public"."ContentType" AS ENUM('POST', 'LINK', 'QUESTION', 'VIDEO', 'DISCUSSION');--> statement-breakpoint
CREATE TYPE "public"."FeedSourceStatus" AS ENUM('ACTIVE', 'PAUSED', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."ReportReason" AS ENUM('SPAM', 'HARASSMENT', 'HATE_SPEECH', 'MISINFORMATION', 'COPYRIGHT', 'NSFW', 'OFF_TOPIC', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."ReportStatus" AS ENUM('PENDING', 'REVIEWED', 'DISMISSED', 'ACTIONED');--> statement-breakpoint
CREATE TYPE "public"."VoteType" AS ENUM('UP', 'DOWN');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'published', 'scheduled', 'unlisted');--> statement-breakpoint
CREATE TYPE "public"."post_type" AS ENUM('article', 'discussion', 'link', 'resource');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('spam', 'harassment', 'hate_speech', 'misinformation', 'copyright', 'nsfw', 'off_topic', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'reviewed', 'dismissed', 'actioned');--> statement-breakpoint
CREATE TYPE "public"."SponsorBudgetRange" AS ENUM('EXPLORING', 'UNDER_500', 'BETWEEN_500_2000', 'BETWEEN_2000_5000', 'OVER_5000');--> statement-breakpoint
CREATE TYPE "public"."SponsorInquiryStatus" AS ENUM('PENDING', 'CONTACTED', 'CONVERTED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."vote_type" AS ENUM('up', 'down');--> statement-breakpoint
CREATE TABLE "AggregatedArticle" (
	"id" text PRIMARY KEY NOT NULL,
	"sourceId" integer NOT NULL,
	"shortId" varchar(20),
	"title" text NOT NULL,
	"slug" varchar(350) NOT NULL,
	"excerpt" text,
	"externalUrl" varchar(2000) NOT NULL,
	"imageUrl" text,
	"ogImageUrl" text,
	"sourceAuthor" varchar(200),
	"publishedAt" timestamp with time zone,
	"fetchedAt" timestamp with time zone,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"downvotes" integer DEFAULT 0 NOT NULL,
	"clickCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AggregatedArticleBookmark" (
	"id" serial PRIMARY KEY NOT NULL,
	"articleId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AggregatedArticleTag" (
	"id" serial PRIMARY KEY NOT NULL,
	"articleId" text NOT NULL,
	"tagId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AggregatedArticleVote" (
	"id" serial PRIMARY KEY NOT NULL,
	"articleId" text NOT NULL,
	"userId" text NOT NULL,
	"voteType" "VoteType" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "bookmarks_post_id_user_id_key" UNIQUE("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "comment_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"vote_type" "vote_type" NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "comment_votes_comment_id_user_id_key" UNIQUE("comment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"post_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"parent_id" uuid,
	"path" text NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL,
	"body" text NOT NULL,
	"upvotes_count" integer DEFAULT 0 NOT NULL,
	"downvotes_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp(3) with time zone,
	"legacy_comment_id" integer
);
--> statement-breakpoint
CREATE TABLE "Content" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "ContentType" NOT NULL,
	"title" varchar(500) NOT NULL,
	"body" text,
	"excerpt" text,
	"userId" text,
	"externalUrl" varchar(2000),
	"imageUrl" text,
	"ogImageUrl" text,
	"sourceId" integer,
	"sourceAuthor" varchar(200),
	"published" boolean DEFAULT false NOT NULL,
	"publishedAt" timestamp(3) with time zone,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"downvotes" integer DEFAULT 0 NOT NULL,
	"readTimeMins" integer,
	"clickCount" integer DEFAULT 0 NOT NULL,
	"slug" varchar(300),
	"canonicalUrl" text,
	"coverImage" text,
	"showComments" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ContentBookmark" (
	"id" serial PRIMARY KEY NOT NULL,
	"contentId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "ContentBookmark_contentId_userId_key" UNIQUE("contentId","userId")
);
--> statement-breakpoint
CREATE TABLE "ContentReport" (
	"id" serial PRIMARY KEY NOT NULL,
	"contentId" text,
	"discussionId" integer,
	"reporterId" text NOT NULL,
	"reason" "ReportReason" NOT NULL,
	"details" text,
	"status" "ReportStatus" DEFAULT 'PENDING' NOT NULL,
	"reviewedById" text,
	"reviewedAt" timestamp(3) with time zone,
	"actionTaken" text,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ContentTag" (
	"id" serial PRIMARY KEY NOT NULL,
	"contentId" text NOT NULL,
	"tagId" integer NOT NULL,
	CONSTRAINT "ContentTag_contentId_tagId_key" UNIQUE("contentId","tagId")
);
--> statement-breakpoint
CREATE TABLE "ContentVote" (
	"id" serial PRIMARY KEY NOT NULL,
	"contentId" text NOT NULL,
	"userId" text NOT NULL,
	"voteType" "VoteType" NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "ContentVote_contentId_userId_key" UNIQUE("contentId","userId")
);
--> statement-breakpoint
CREATE TABLE "Discussion" (
	"id" serial PRIMARY KEY NOT NULL,
	"body" text NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"contentId" text NOT NULL,
	"userId" text NOT NULL,
	"parentId" integer,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"downvotes" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "Discussion_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "DiscussionVote" (
	"id" serial PRIMARY KEY NOT NULL,
	"discussionId" integer NOT NULL,
	"userId" text NOT NULL,
	"voteType" "VoteType" NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "DiscussionVote_discussionId_userId_key" UNIQUE("discussionId","userId")
);
--> statement-breakpoint
CREATE TABLE "feed_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"website_url" text,
	"logo_url" text,
	"slug" varchar(100),
	"category" varchar(50),
	"description" text,
	"status" "feed_source_status" DEFAULT 'active' NOT NULL,
	"user_id" text,
	"last_fetched_at" timestamp(3) with time zone,
	"last_success_at" timestamp(3) with time zone,
	"error_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "FeedSource" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"websiteUrl" text,
	"logoUrl" text,
	"category" varchar(50),
	"slug" varchar(100),
	"description" text,
	"status" "FeedSourceStatus" DEFAULT 'ACTIVE' NOT NULL,
	"lastFetchedAt" timestamp(3) with time zone,
	"lastSuccessAt" timestamp(3) with time zone,
	"errorCount" integer DEFAULT 0 NOT NULL,
	"lastError" text,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "FeedSource_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "post_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" uuid NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "post_tags_post_id_tag_id_key" UNIQUE("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "post_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"vote_type" "vote_type" NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "post_votes_post_id_user_id_key" UNIQUE("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "PostVote" (
	"id" serial PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"userId" text NOT NULL,
	"voteType" "VoteType" NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "PostVote_postId_userId_key" UNIQUE("postId","userId")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "post_type" NOT NULL,
	"author_id" text NOT NULL,
	"title" varchar(500) NOT NULL,
	"slug" varchar(300) NOT NULL,
	"excerpt" text,
	"body" text,
	"canonical_url" text,
	"cover_image" text,
	"external_url" varchar(2000),
	"source_id" integer,
	"source_author" varchar(200),
	"reading_time" integer,
	"upvotes_count" integer DEFAULT 0 NOT NULL,
	"downvotes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp(3) with time zone,
	"featured" boolean DEFAULT false NOT NULL,
	"pinned_until" timestamp(3) with time zone,
	"show_comments" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"legacy_post_id" text
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" uuid,
	"comment_id" uuid,
	"reporter_id" text NOT NULL,
	"reason" "report_reason" NOT NULL,
	"details" text,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" text,
	"reviewed_at" timestamp(3) with time zone,
	"action_taken" text,
	"created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SponsorInquiry" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"company" varchar(100),
	"phone" varchar(50),
	"interests" text,
	"budgetRange" "SponsorBudgetRange" DEFAULT 'EXPLORING',
	"goals" text,
	"status" "SponsorInquiryStatus" DEFAULT 'PENDING' NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session" ADD PRIMARY KEY ("sessionToken");--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "upvotes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "downvotes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "AggregatedArticle" ADD CONSTRAINT "AggregatedArticle_sourceId_FeedSource_id_fk" FOREIGN KEY ("sourceId") REFERENCES "public"."FeedSource"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AggregatedArticleBookmark" ADD CONSTRAINT "AggregatedArticleBookmark_articleId_AggregatedArticle_id_fk" FOREIGN KEY ("articleId") REFERENCES "public"."AggregatedArticle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AggregatedArticleBookmark" ADD CONSTRAINT "AggregatedArticleBookmark_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AggregatedArticleTag" ADD CONSTRAINT "AggregatedArticleTag_articleId_AggregatedArticle_id_fk" FOREIGN KEY ("articleId") REFERENCES "public"."AggregatedArticle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AggregatedArticleTag" ADD CONSTRAINT "AggregatedArticleTag_tagId_Tag_id_fk" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AggregatedArticleVote" ADD CONSTRAINT "AggregatedArticleVote_articleId_AggregatedArticle_id_fk" FOREIGN KEY ("articleId") REFERENCES "public"."AggregatedArticle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AggregatedArticleVote" ADD CONSTRAINT "AggregatedArticleVote_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Content" ADD CONSTRAINT "Content_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Content" ADD CONSTRAINT "Content_sourceId_FeedSource_id_fk" FOREIGN KEY ("sourceId") REFERENCES "public"."FeedSource"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ContentBookmark" ADD CONSTRAINT "ContentBookmark_contentId_Content_id_fk" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ContentBookmark" ADD CONSTRAINT "ContentBookmark_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_contentId_Content_id_fk" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_discussionId_Discussion_id_fk" FOREIGN KEY ("discussionId") REFERENCES "public"."Discussion"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reporterId_user_id_fk" FOREIGN KEY ("reporterId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reviewedById_user_id_fk" FOREIGN KEY ("reviewedById") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ContentTag" ADD CONSTRAINT "ContentTag_contentId_Content_id_fk" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ContentTag" ADD CONSTRAINT "ContentTag_tagId_Tag_id_fk" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ContentVote" ADD CONSTRAINT "ContentVote_contentId_Content_id_fk" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ContentVote" ADD CONSTRAINT "ContentVote_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_contentId_Content_id_fk" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Discussion"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DiscussionVote" ADD CONSTRAINT "DiscussionVote_discussionId_Discussion_id_fk" FOREIGN KEY ("discussionId") REFERENCES "public"."Discussion"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DiscussionVote" ADD CONSTRAINT "DiscussionVote_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "feed_sources" ADD CONSTRAINT "feed_sources_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_id_Tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."Tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostVote" ADD CONSTRAINT "PostVote_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PostVote" ADD CONSTRAINT "PostVote_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_source_id_feed_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."feed_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "aggregated_article_source_idx" ON "AggregatedArticle" USING btree ("sourceId");--> statement-breakpoint
CREATE INDEX "aggregated_article_slug_idx" ON "AggregatedArticle" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "aggregated_article_published_idx" ON "AggregatedArticle" USING btree ("publishedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "aggregated_article_url_idx" ON "AggregatedArticle" USING btree ("externalUrl");--> statement-breakpoint
CREATE UNIQUE INDEX "article_bookmark_unique" ON "AggregatedArticleBookmark" USING btree ("articleId","userId");--> statement-breakpoint
CREATE INDEX "article_bookmark_user_idx" ON "AggregatedArticleBookmark" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "article_tag_unique" ON "AggregatedArticleTag" USING btree ("articleId","tagId");--> statement-breakpoint
CREATE INDEX "article_tag_article_idx" ON "AggregatedArticleTag" USING btree ("articleId");--> statement-breakpoint
CREATE UNIQUE INDEX "article_vote_unique" ON "AggregatedArticleVote" USING btree ("articleId","userId");--> statement-breakpoint
CREATE INDEX "article_vote_article_idx" ON "AggregatedArticleVote" USING btree ("articleId");--> statement-breakpoint
CREATE INDEX "article_vote_user_idx" ON "AggregatedArticleVote" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "bookmarks_user_id_idx" ON "bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookmarks_post_id_idx" ON "bookmarks" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "comment_votes_comment_id_idx" ON "comment_votes" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "comments_post_id_idx" ON "comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "comments_author_id_idx" ON "comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "comments_parent_id_idx" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "comments_created_at_idx" ON "comments" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "comments_legacy_comment_id_idx" ON "comments" USING btree ("legacy_comment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "Content_slug_key" ON "Content" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "Content_type_index" ON "Content" USING btree ("type");--> statement-breakpoint
CREATE INDEX "Content_userId_index" ON "Content" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Content_sourceId_index" ON "Content" USING btree ("sourceId");--> statement-breakpoint
CREATE INDEX "Content_publishedAt_index" ON "Content" USING btree ("publishedAt");--> statement-breakpoint
CREATE INDEX "Content_published_index" ON "Content" USING btree ("published");--> statement-breakpoint
CREATE INDEX "ContentReport_status_index" ON "ContentReport" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ContentReport_reporterId_index" ON "ContentReport" USING btree ("reporterId");--> statement-breakpoint
CREATE INDEX "ContentReport_contentId_index" ON "ContentReport" USING btree ("contentId");--> statement-breakpoint
CREATE INDEX "ContentReport_discussionId_index" ON "ContentReport" USING btree ("discussionId");--> statement-breakpoint
CREATE INDEX "ContentVote_contentId_index" ON "ContentVote" USING btree ("contentId");--> statement-breakpoint
CREATE INDEX "Discussion_contentId_index" ON "Discussion" USING btree ("contentId");--> statement-breakpoint
CREATE INDEX "Discussion_userId_index" ON "Discussion" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "DiscussionVote_discussionId_index" ON "DiscussionVote" USING btree ("discussionId");--> statement-breakpoint
CREATE UNIQUE INDEX "feed_sources_url_key" ON "feed_sources" USING btree ("url");--> statement-breakpoint
CREATE UNIQUE INDEX "feed_sources_slug_key" ON "feed_sources" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "feed_sources_user_id_idx" ON "feed_sources" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "FeedSource_url_key" ON "FeedSource" USING btree ("url");--> statement-breakpoint
CREATE UNIQUE INDEX "FeedSource_slug_key" ON "FeedSource" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "FeedSource_status_index" ON "FeedSource" USING btree ("status");--> statement-breakpoint
CREATE INDEX "post_tags_post_id_idx" ON "post_tags" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_tags_tag_id_idx" ON "post_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "post_votes_post_id_idx" ON "post_votes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "PostVote_postId_index" ON "PostVote" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "posts_author_id_idx" ON "posts" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_legacy_post_id_idx" ON "posts" USING btree ("legacy_post_id");--> statement-breakpoint
CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "posts_published_at_idx" ON "posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "posts_type_idx" ON "posts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "posts_source_id_idx" ON "posts" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "posts_featured_idx" ON "posts" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_reporter_id_idx" ON "reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "reports_post_id_idx" ON "reports" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "reports_comment_id_idx" ON "reports" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "SponsorInquiry_status_index" ON "SponsorInquiry" USING btree ("status");--> statement-breakpoint
CREATE INDEX "SponsorInquiry_email_index" ON "SponsorInquiry" USING btree ("email");