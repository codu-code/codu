import { permanentRedirect } from "next/navigation";

// The feed now lives at "/". 308-redirect legacy /feed links here, preserving
// any query (?tag=, ?type=, ?view=following, ?sort=).
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) =>
      v === undefined ? [] : Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]],
    ) as [string, string][],
  ).toString();
  permanentRedirect(`/${qs ? `?${qs}` : ""}`);
}
