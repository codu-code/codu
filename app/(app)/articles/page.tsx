import { permanentRedirect } from "next/navigation";

// Permanently redirect the legacy /articles index to the unified feed —
// /articles carries years of equity that should consolidate onto "/".
export default function Page() {
  permanentRedirect("/?type=article");
}
