import { type Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { job } from "@/server/db/schema";
import { ogJobImage } from "@/lib/og/url";
import JobDetailClient from "./_client";

type Props = { params: Promise<{ slug: string }> };

const JOB_TYPE_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  freelancer: "Freelance",
  other: "Contract",
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;

  const [listing] = await db
    .select()
    .from(job)
    .where(and(eq(job.slug, slug), eq(job.status, "active")))
    .limit(1);

  if (!listing) {
    return { title: "Job Not Found" };
  }

  const title = `${listing.jobTitle} at ${listing.companyName} | Codú`;
  const description =
    `${listing.jobTitle} — ${listing.companyName}. ${listing.jobLocation}.`.trim();
  const ogImage = ogJobImage({
    company: listing.companyName,
    role: listing.jobTitle,
    location: listing.jobLocation,
    jobType: JOB_TYPE_LABEL[listing.type] ?? "Full-time",
    tags: listing.tags,
    featured: listing.featured,
    updatedAt: listing.updatedAt,
  });

  return {
    title,
    description,
    alternates: { canonical: `/jobs/${listing.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Codú",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function JobDetailPage(props: Props) {
  const { slug } = await props.params;
  return <JobDetailClient slug={slug} />;
}
