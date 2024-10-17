import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { series, post } from "@/server/db/schema";
import { UpdateSeriesSchema } from "@/schema/series";
import {eq} from "drizzle-orm";
export const seriesRouter = createTRPCRouter({
    update: protectedProcedure
        .input(UpdateSeriesSchema)
        .mutation(async ({input, ctx}) => {
            const {postId, seriesName} = input;
            console.group("series Name: ", seriesName);
            const currentPost = await ctx.db.query.post.findFirst({
                columns: {
                  id: true,
                  seriesId: true,
                  userId: true
                },
                with: {
                  series: {
                    columns: {
                      id: true,
                      title: true
                    },
                  },
                },
                where: (post, { eq }) => eq(post.id, postId),
              });
            if (currentPost?.userId !== ctx.session.user.id) {
                throw new TRPCError({
                  code: "FORBIDDEN",
                });
            }
            const createNewSeries = async (seriesTitle: string) => {
              // check if a series with that name already exists
              // or else create a new one
              let seriesId : number;
              const currSeries = await ctx.db.query.series.findFirst({
                columns: {
                  id: true
                },
                where: (series, { eq }) => eq(series.title, seriesTitle),
              })
              if(!currSeries){
                const [newSeries] = await ctx.db.insert(series).values({
                  title: seriesTitle, 
                  userId: ctx.session.user.id,
                  updatedAt: new Date()  
                }).returning();
                
                seriesId = newSeries.id;
              }
              else{
                seriesId = currSeries.id;
              }
                // update that series id in the current post
                await ctx.db
                .update(post)
                .set({
                    seriesId: seriesId
                })
                .where(eq(post.id, currentPost.id));
            }
            const unlinkSeries = async (seriesId: number) => {
              // Check if the user has added a another post with the same series id previously
              const anotherPostInThisSeries = await ctx.db.query.post.findFirst({
                where: (post, { eq, and, ne }) => 
                    and (
                      ne(post.id, currentPost.id),
                      eq(post.seriesId, currentPost.seriesId!)
                    )
              })
              // if another post with the same seriesId is present, then do nothing
              // else remove the series from the series table
              if(!anotherPostInThisSeries){
                  await ctx.db.delete(series).where(eq(series.id, seriesId));
              }
              // update that series id in the current post
              await ctx.db
              .update(post)
              .set({
                  seriesId: null
              })
              .where(eq(post.id, currentPost.id));
            }
            
            if(seriesName){
                // check if the current post is already linked to a series
                if(currentPost?.seriesId){
                    // check if the series title is same as the current series name
                    // then we do nothing
                    if(currentPost?.series?.title !== seriesName){
                        // then the user has updated the series name in this particular edit
                        // Check if there is another post with the same title, else delete the series
                        // and create a new post with the new series name
                        // and update that new series id in the post
                        await unlinkSeries(currentPost.seriesId);
                        await createNewSeries(seriesName);
                    }
                }
                else{
                    // the current post is not yet linked to a seriesId
                    // so create a new series and put that Id in the post
                    await createNewSeries(seriesName);
                }
            }
            else{
                // either the user has not added the series Name (We do nothing)
                // or while editing the post, the user has removed the series name
                if(currentPost.seriesId !== null){
                    await unlinkSeries(currentPost.seriesId);
                }
            } 
        })
})