import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";

import Twitter from "../../icons/x.svg";
import Github from "../../icons/github.svg";
import Discord from "../../icons/discord.svg";
import Youtube from "../../icons/youtube.svg";

import {
  footerNav,
  discordInviteUrl,
  githubUrl,
  twitterUrl,
  youtubeUrl,
} from "../../config/site_settings";

const navigation = {
  main: footerNav,
  social: [
    {
      name: "Twitter",
      customStyle: "hover:bg-twitter focus:bg-twitter",
      href: twitterUrl,
      icon: Twitter,
    },
    {
      name: "GitHub",
      customStyle: "hover:bg-github focus:bg-github",
      href: githubUrl,
      icon: Github,
    },
    {
      name: "Discord",
      customStyle: "hover:bg-discord focus:bg-discord",
      href: discordInviteUrl,
      icon: Discord,
    },
    {
      name: "Youtube",
      customStyle: "hover:bg-youtube focus:bg-youtube",
      href: youtubeUrl,
      icon: Youtube,
    },
  ],
};

const Footer = () => {
  return (
    <footer className="bg-neutral-100 dark:bg-black">
      <div className="mx-auto max-w-7xl overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
        <nav
          className="-mx-5 -my-2 flex flex-wrap justify-center"
          aria-label="Footer"
        >
          {navigation.main.map((item) => (
            <div key={item.name} className="px-5 py-2">
              {item.href.includes("http") ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-style p-1 text-base text-neutral-600 hover:text-neutral-500 dark:text-neutral-500 dark:hover:text-neutral-400"
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  className="focus-style p-1 text-base text-neutral-600 hover:text-neutral-500 dark:text-neutral-500 dark:hover:text-neutral-400"
                  href={item.href}
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </nav>
        <div className="mt-8 flex justify-center space-x-8">
          {navigation.social.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`focus-style rounded-md p-1 transition-all duration-300 hover:scale-105 hover:text-white hover:brightness-110 focus:scale-105 focus:text-white focus:brightness-110 ${item.customStyle.toLowerCase()}`}
            >
              <span className="sr-only">{item.name}</span>
              <item.icon className="h-6 w-6" aria-hidden="true" />
            </a>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-neutral-600 dark:text-neutral-500">
          &copy; {Temporal.Now.plainDateISO().year} Codú Limited
        </p>
      </div>
    </footer>
  );
};

export default Footer;
