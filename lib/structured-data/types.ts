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

export interface WebSite {
  "@type": "WebSite";
  name: string;
  url: string;
  description?: string;
  publisher?: Organization;
}

export interface InteractionCounter {
  "@type": "InteractionCounter";
  interactionType: { "@type": "CommentAction" | "LikeAction" };
  userInteractionCount: number;
}

export interface Comment {
  "@type": "Comment";
  text: string;
  dateCreated: string;
  author: Person;
  url?: string;
}

export interface DiscussionForumPosting {
  "@type": "DiscussionForumPosting";
  headline: string;
  text?: string;
  datePublished: string;
  dateModified?: string;
  author: Person;
  mainEntityOfPage: string;
  interactionStatistic: InteractionCounter[];
  comment: Comment[];
}

export interface ProfilePage {
  "@type": "ProfilePage";
  dateCreated?: string;
  mainEntity: Person;
}

// Wrapper type for JSON-LD with @context
export type WithContext<T> = {
  "@context": "https://schema.org";
} & T;
