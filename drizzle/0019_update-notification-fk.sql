ALTER TABLE "Notification" DROP CONSTRAINT "Notification_postId_Post_id_fk";
--> statement-breakpoint
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_commentId_Comment_id_fk";
--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_postId_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_commentId_comments_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE cascade;