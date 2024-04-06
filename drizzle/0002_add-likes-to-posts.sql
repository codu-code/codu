/* Custom SQL to set value of Post.likes correctly for each post */
UPDATE public."Post"
SET likes = (
    SELECT COUNT(*)
    FROM public."Like"
    WHERE public."Like"."postId" = public."Post".id
 );