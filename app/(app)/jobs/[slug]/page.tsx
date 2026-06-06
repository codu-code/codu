import JobDetailClient from "./_client";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <JobDetailClient slug={slug} />;
}
