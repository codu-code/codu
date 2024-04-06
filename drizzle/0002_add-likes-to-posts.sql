/* Custom SQL to set value of Post.likes correctly for each post */
UPDATE "Post"
SET likes = (
    SELECT COUNT(*)
    FROM public."Like"
    WHERE public."Like"."postId" = "Post".id
 );