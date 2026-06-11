/**
 * Structured Data (JSON-LD) utilities for SEO
 *
 * This module provides schema.org structured data builders
 * for improved search engine visibility and AI model citations.
 */

// Types
export type {
  Article,
  BreadcrumbItem,
  BreadcrumbList,
  Comment,
  DiscussionForumPosting,
  ImageObject,
  InteractionCounter,
  Organization,
  Person,
  ProfilePage,
  WebSite,
  WithContext,
} from "./types";

// Schema builders
export {
  getOrganizationSchema,
  getOrganizationRef,
} from "./schemas/organization";
export { getPersonSchema, getPersonRef } from "./schemas/person";
export { getArticleSchema } from "./schemas/article";
export { getNewsArticleSchema } from "./schemas/news-article";
export { getBreadcrumbSchema } from "./schemas/breadcrumb";
export { getWebSiteSchema } from "./schemas/website";
export { getDiscussionForumPostingSchema } from "./schemas/discussion-forum-posting";
export { getProfilePageSchema } from "./schemas/profile-page";
