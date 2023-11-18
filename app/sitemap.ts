// @TODO would like to generate here instead of API but couldn't get secrets to behave as expected at build time in CDK
import * as Sentry from "@sentry/nextjs";

export default async function sitemap() {
  try {
    const response = await fetch("https://www.codu.co/api/sitemap");
    const { data } = await response.json();
    return data;
  } catch (error) {
    Sentry.captureException(error);
  }
}