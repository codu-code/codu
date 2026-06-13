import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Codú",
    short_name: "Codú",
    description:
      "Codú is the community for AI builders and indie hackers. Learn to build with AI, share what you ship, and grow with people doing the same.",
    start_url: ".",
    display: "standalone",
    background_color: "#fff",
    theme_color: "#fff",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
