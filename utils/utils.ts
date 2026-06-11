import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getUrlFromString(str: string) {
  if (isValidUrl(str)) return str;
  try {
    if (str.includes(".") && !str.includes(" ")) {
      return new URL(`https://${str}`).toString();
    }
  } catch {
    return null;
  }
}

// @TODO move this somewhere nicer
const commonCamelCaseCSWords = new Map([
  ["javascript", "JavaScript"],
  ["css", "CSS"],
  ["js", "JS"],
  ["typescript", "TypeScript"],
]);

// @TODO make a list of words like "JavaScript" that we can map the words to if they exist
/**
 * URL-friendly tag slug from a title. Must stay in sync with the slug written
 * on tag creation (see server/api/router/content.ts + tag.ts). Pure + client-safe
 * — used as a fallback for tag links when a row's stored slug isn't loaded.
 */
export const slugifyTag = (title: string): string =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || title.toLowerCase();

export const getCamelCaseFromLower = (str: string) => {
  let formatedString = commonCamelCaseCSWords.get(str.toLowerCase());
  if (!formatedString) {
    formatedString = str
      .toLowerCase()
      .replace(/(?:^|\s|["'([{])+\S/g, (match) => match.toUpperCase());
  }
  return formatedString;
};
