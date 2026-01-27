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
  ImageObject,
  Organization,
  Person,
  SearchAction,
  WebSite,
  WithContext,
} from "./types";

// Schema builders
export { getOrganizationSchema, getOrganizationRef } from "./schemas/organization";
export { getPersonSchema, getPersonRef } from "./schemas/person";
export { getArticleSchema } from "./schemas/article";
export { getNewsArticleSchema } from "./schemas/news-article";
export { getBreadcrumbSchema } from "./schemas/breadcrumb";
export { getWebSiteSchema } from "./schemas/website";
