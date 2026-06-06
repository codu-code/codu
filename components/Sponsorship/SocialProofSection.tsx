import Link from "next/link";
import Image from "next/image";

const sponsors = [
  {
    name: "Version 1",
    logo: "/images/sponsors/version1.png",
    href: "https://www.version1.com/",
  },
  {
    name: "LearnUpon",
    logo: "/images/sponsors/learnupon.png",
    href: "https://www.learnupon.com/",
  },
  {
    name: "OfferZen",
    logo: "/images/sponsors/offerzen.png",
    href: "https://www.offerzen.com/",
  },
  {
    name: "WeWork",
    logo: "/images/sponsors/wework.png",
    href: "https://www.wework.com/",
  },
  {
    name: "Harvey Nash",
    logo: "/images/sponsors/harveynash.png",
    href: "https://www.harveynash.com/",
  },
  {
    name: "NineDots",
    logo: "/images/sponsors/ninedots.png",
    href: "/company/ninedots",
  },
];

export function SocialProofSection() {
  return (
    <section className="bg-gradient-to-r from-orange-400 to-pink-600 py-16">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          Trusted by Leading Tech Companies
        </h2>

        {/* Logo grid */}
        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {sponsors.map((sponsor) => (
            <Link
              key={sponsor.name}
              href={sponsor.href}
              target={sponsor.href.startsWith("http") ? "_blank" : undefined}
              rel={
                sponsor.href.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
              className="flex items-center justify-center rounded-lg bg-white/10 p-4 backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <Image
                src={sponsor.logo}
                alt={sponsor.name}
                width={120}
                height={48}
                className="h-10 w-auto max-w-full object-contain"
              />
            </Link>
          ))}
        </div>

        {/* Testimonial */}
        <blockquote className="mt-12 text-center">
          <p className="text-lg italic text-white/90">
            &ldquo;Partnering with Codú gave us direct access to a thriving
            community of builders. The engagement is genuine and the team is
            fantastic to work with.&rdquo;
          </p>
          <footer className="mt-4 text-sm font-medium text-white/80">
            - Previous Sponsor Partner
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
