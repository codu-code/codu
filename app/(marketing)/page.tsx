import { permanentRedirect } from "next/navigation";

// The feed is the landing surface — there is no marketing homepage.
// Logged-out visitors land directly on the public, indexable feed (which
// carries its own sign-in bar + action-gated modal). The previous marketing
// hero (GradientBlinds + value props) is retired; the component remains for
// reuse on /about. 308 so the feed becomes the canonical home for SEO.
export default function HomePage() {
  permanentRedirect("/feed");
}
