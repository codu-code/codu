import { signOut } from "next-auth/react";

export const highlighted_members = [
  {
    name: "Praveen Kumar",
    role: "Full-Stack Developer",
    emoji: "🛠️",
    imageUrl: "https://avatars.githubusercontent.com/u/19896788?v=4",
    githubUrl: "https://github.com/pkspyder007",
    twitterUrl: "https://twitter.com/pkspyder007",
  },
  {
    name: "Niall Maher",
    role: "Codú Community Founder",
    emoji: "🛠️",
    imageUrl: "https://avatars.githubusercontent.com/u/12615742?v=4",
    twitterUrl: "https://twitter.com/nialljoemaher",
    linkedinUrl: "https://www.linkedin.com/in/nialljoemaher/",
  },
  {
    name: "Jhey Tompkins",
    role: "DevRel @ Google",
    emoji: "🐻",
    imageUrl: "https://avatars.githubusercontent.com/u/842246?v=4",
    twitterUrl: "https://twitter.com/jh3yy",
    githubUrl: "https://github.com/jh3y",
  },
  {
    name: "Brancu Alexandru",
    emoji: "✨",
    role: "Web Developer",
    imageUrl: "https://avatars.githubusercontent.com/u/92156286?v=4",
    twitterUrl: "https://twitter.com/BrancuAlexandru",
    githubUrl: "https://github.com/BrancuAlexandru",
  },
  {
    name: "Carolina Cobo",
    emoji: "🛠️",
    role: "Web Developer",
    imageUrl: "https://avatars.githubusercontent.com/u/58437550?v=4",
    twitterUrl: "https://twitter.com/Carolina_Cobo8",
    linkedinUrl: "https://www.linkedin.com/in/carolina-cobo/",
    githubUrl: "https://github.com/CarolinaCobo",
  },
  {
    name: "Adam O'Reilly",
    role: "Web Developer",
    imageUrl: "https://avatars.githubusercontent.com/u/78261980?v=4",
    linkedinUrl: "https://www.linkedin.com/in/adam-o-reilly-js/",
    githubUrl: "https://github.com/aor2405",
  },
];

export const benefits = [
  {
    title: "Job opportunities",
    body: "Exclusive job opportunities posted by community members and a job board are coming soon.",
  },
  {
    title: "Mentorship",
    body: "It’s easier to learn to code with a little push. Get access to top web developers for when you need help.",
  },
  {
    title: "Open Source Software",
    body: "Building together is fun! Contribute to open-source software with other members.",
  },
];

export const rules = [
  {
    title: "Introduce yourself!",
    body: "Please introduce yourself and a little about you, such as your current job, goals, and where you are from when you enter the group! We want you to share who you are and where you’re from.",
  },
  {
    title: "Be kind and respectful",
    body: "Let’s build a positive, welcoming environment where everyone feels safe to share ideas, thoughts, and feedback. Let’s be supportive, respect individual opinions, and report inappropriate posts if needed.",
  },
  {
    title: "Give more than you take",
    body: "There will always be opportunities to help another person with many people and levels. We are here to support you, so make sure you try to support others in the community.",
  },

  {
    title: "Don't double post",
    body: "When asking questions or posting things, look for the most relevant channel and post it there — posting across channels or repeating questions pollutes the conversations for everyone.",
  },
];

export const footerNav = [
  { name: "Home", href: "/" },
  { name: "Articles", href: "/articles" },
  { name: "Events", href: "https://www.meetup.com/codu-community/" },
  { name: "Sponsorship", href: "/sponsorship" },
];

export const navigation = [
  { name: "Articles", href: "/articles" },
  { name: "Events", href: "https://www.meetup.com/codu-community/" },
  { name: "Support us", href: "/sponsorship" },
];

export const userNavigation = [
  { name: "Your Profile", href: "/profile" },
  { name: "Settings", href: "/settings" },
  { name: "Sign out", onClick: () => signOut() },
];

export const userSubNav = [
  { name: "Drafts", href: "/profile" },
  { name: "New Post", href: "/new", fancy: true },
];

export const subNav = [
  { name: "Sign in", href: "/get-started" },
  { name: "Sign up for free", href: "/get-started", fancy: true },
];

type Authors = {
  [index: string]: any;
};

export const authors: Authors = {
  pkspyder007: {
    name: "Praveen Kumar",
    role: "Full-Stack Developer",
    emoji: "🛠️",
    bio: "Full Stack @ Quizizz, Google Developer Students Lead, Moderator Codú Community",
    imageUrl: "https://avatars.githubusercontent.com/u/19896788?v=4",
  },
  nialljoemaher: {
    name: "Niall Maher",
    role: "Codú Community Founder",
    emoji: "🛠️",
    bio: "I've worked in nearly every corner of technology businesses; Lead Developer, Software Architect, Product Manager, CTO and now happily a Founder @ Codú.",
    imageUrl: "https://avatars.githubusercontent.com/u/12615742?v=4",
  },
};

export const discordInviteUrl = "https://discord.gg/NxSkYtZ";
export const githubUrl = "https://github.com/codu-code/codu";
export const twitterUrl = "https://twitter.com/coducommunity";
export const youtubeUrl = "https://www.youtube.com/c/Cod%C3%BACommunity";

export const articlesDirectory = "/content/articles";
