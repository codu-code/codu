// Single dynamic OG endpoint for @vercel/og (next/og). All shareable pages
// point their openGraph/twitter images here via the builders in lib/og/url.ts.
//
//   GET /og?type=main&id=home
//   GET /og?type=post&kind=article&title=...&author=...&role=...&hue=200&read=6%20min&tags=RAG,evals&cover=https://...
//   GET /og?type=profile&name=...&role=...&hue=200&location=...&bio=...&followers=3200&joined=...&interests=RAG,evals
//   GET /og?type=publication&name=...&hue=184&tagline=...&articles=86&followers=12400
//   GET /og?type=job&company=...&logo=A&role=...&location=...&jobType=Full-time&tags=AI-native,LLM&featured=1
import { ImageResponse } from "next/og";
import * as Sentry from "@sentry/nextjs";
import { OgImage, type OgParams } from "@/lib/og/templates";
import { coduFonts } from "@/lib/og/fonts";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Edited records pass a `v` param, so cards can cache hard and indefinitely.
const CACHE_CONTROL = "public, immutable, no-transform, max-age=31536000";

// Load and reuse the font set per worker.
let _fonts: Awaited<ReturnType<typeof coduFonts>> | null = null;
const fonts = async () => (_fonts ??= await coduFonts());

// Embed the wordmark as a data URI (fetched + cached once per worker) so Satori
// never has to resolve a same-origin <img> mid-render — that fetch is flaky in
// local dev and adds a round-trip in prod.
let _logo: string | null = null;
async function logo(origin: string) {
  if (_logo) return _logo;
  const res = await fetch(`${origin}/og/wordmark-white.png`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return (_logo = `data:image/png;base64,${btoa(binary)}`);
}

const list = (v: string | null) =>
  v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
const num = (v: string | null, d = 0) => (v != null && v !== "" ? Number(v) : d);

export async function GET(req: Request) {
  try {
    const { searchParams: q, origin } = new URL(req.url);
    const wordmark = await logo(origin);
    const type = q.get("type") || "main";
    let params: OgParams;

    if (type === "post") {
      params = {
        type: "post",
        kind: (q.get("kind") as "article" | "discussion" | "link") || "article",
        title: q.get("title") || "Untitled",
        author: {
          name: q.get("author") || "Anonymous",
          role: q.get("role") || "",
          hue: num(q.get("hue"), 184),
        },
        tags: list(q.get("tags")),
        publication: q.get("pub")
          ? { name: q.get("pub")!, hue: num(q.get("pubHue"), 184) }
          : undefined,
        source: q.get("source") || undefined,
        read: q.get("read") || undefined,
        cover: q.get("cover") || undefined,
        logo: wordmark,
      };
    } else if (type === "profile") {
      params = {
        type: "profile",
        name: q.get("name") || "",
        role: q.get("role") || "",
        hue: num(q.get("hue"), 184),
        location: q.get("location") || "",
        bio: q.get("bio") || "",
        topHelper: q.get("topHelper") === "1",
        followers: num(q.get("followers")),
        joined: q.get("joined") || "",
        interests: list(q.get("interests")),
        logo: wordmark,
      };
    } else if (type === "publication") {
      params = {
        type: "publication",
        name: q.get("name") || "",
        hue: num(q.get("hue"), 184),
        tagline: q.get("tagline") || "",
        articleCount: num(q.get("articles")),
        followers: num(q.get("followers")),
        logo: wordmark,
      };
    } else if (type === "job") {
      params = {
        type: "job",
        company: q.get("company") || "",
        logo: q.get("logo") || (q.get("company") || "?")[0],
        role: q.get("role") || "",
        location: q.get("location") || "",
        jobType: q.get("jobType") || "Full-time",
        salary: q.get("salary") || undefined,
        tags: list(q.get("tags")),
        featured: q.get("featured") === "1",
        wordmark,
      };
    } else {
      params = { type: "main", id: q.get("id") || "home", logo: wordmark };
    }

    return new ImageResponse(OgImage(params), {
      ...size,
      fonts: await fonts(),
      headers: { "cache-control": CACHE_CONTROL },
    });
  } catch (err) {
    Sentry.captureException(err);
    return new Response("Failed to generate the image", { status: 500 });
  }
}
