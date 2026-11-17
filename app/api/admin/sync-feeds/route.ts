import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import {
  ingestActiveSources,
  ingestSource,
  type SourceIngestResult,
} from "@/server/lib/rssIngest";

// Syncing every source fetches each new article page in turn.
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    // Check admin auth
    const session = await getServerAuthSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const sourceId = body.sourceId as number | undefined;

    let results: SourceIngestResult[];
    if (sourceId) {
      const result = await ingestSource(db, sourceId);
      if (!result) {
        return NextResponse.json(
          { error: "Feed source not found" },
          { status: 404 },
        );
      }
      // A single-source sync has nothing else to report, so surface its failure.
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 502 });
      }
      results = [result];
    } else {
      results = await ingestActiveSources(db);
    }

    const failed = results.filter((result) => result.error);

    return NextResponse.json({
      success: true,
      stats: {
        sourcesProcessed: results.length - failed.length,
        articlesAdded: results.reduce((sum, result) => sum + result.added, 0),
        articlesSkipped: results.reduce(
          (sum, result) => sum + result.skipped,
          0,
        ),
        errors: failed.map((result) => `${result.sourceName}: ${result.error}`),
      },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: (error as Error).message },
      { status: 500 },
    );
  }
}
