import { permanentRedirect } from "next/navigation";

export default function SponsorshipRedirect() {
  permanentRedirect("/advertise");
}
