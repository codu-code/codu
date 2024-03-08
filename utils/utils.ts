import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

export function getUrlFromString(str: string) {
  if (isValidUrl(str)) return str;
  try {
    if (str.includes(".") && !str.includes(" ")) {
      return new URL(`https://${str}`).toString();
    }
  } catch (e) {
    return null;
  }
}

// @TODO move this somewhere nicer
const commonCamelCaseCSWords = new Map([
  ["javascript", "JavaScript"],
  ["css", "CSS"],
  ["js", "Js"],
  ["typescript", "TypeScript"],
]);

// @TODO make a list of words like "JavaScript" that we can map the words to if they exist
export const getCamelCaseFromLower = (str: string) => {
  let formatedString = commonCamelCaseCSWords.get(str.toLowerCase());
  if (!formatedString) {
    formatedString = str
      .toLowerCase()
      .replace(/(?:^|\s|["'([{])+\S/g, (match) => match.toUpperCase());
  }
  return formatedString;
};
