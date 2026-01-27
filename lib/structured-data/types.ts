/**
 * TypeScript interfaces for schema.org structured data types
 * Used for JSON-LD generation throughout the application
 */

export interface ImageObject {
  "@type": "ImageObject";
  url: string;
  width?: number;
  height?: number;
}

export interface Organization {
  "@type": "Organization";
  name: string;
  url: string;
  logo?: ImageObject;
  sameAs?: string[];
  description?: string;
}

export interface Person {
  "@type": "Person";
  name: string;
  url?: string;
  image?: string;
  description?: string;
  sameAs?: string[];
}

export interface Article {
  "@type": "Article" | "BlogPosting" | "NewsArticle";
  headline: string;
  description?: string;
  image?: string;
  author: Person | Organization;
  publisher: Organization;
  datePublished: string;
  dateModified?: string;
  mainEntityOfPage?: string;
  keywords?: string;
  wordCount?: number;
  url?: string;
}

export interface BreadcrumbItem {
  "@type": "ListItem";
  position: number;
  name: string;
  item?: string;
}

export interface BreadcrumbList {
  "@type": "BreadcrumbList";
  itemListElement: BreadcrumbItem[];
}

export interface SearchAction {
  "@type": "SearchAction";
  target: {
    "@type": "EntryPoint";
    urlTemplate: string;
  };
  "query-input": string;
}

export interface WebSite {
  "@type": "WebSite";
  name: string;
  url: string;
  description?: string;
  publisher?: Organization;
  potentialAction?: SearchAction;
}

// Wrapper type for JSON-LD with @context
export type WithContext<T> = {
  "@context": "https://schema.org";
} & T;
