import { redirect } from "next/navigation";

// Redirect /articles to /?type=article
// The unified feed now handles all content types with filtering
export default function Page() {
  redirect("/?type=article");
}
