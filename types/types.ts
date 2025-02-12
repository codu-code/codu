export type UserNavigationItem =
  | {
      name: string;
      href: string;
      onClick?: undefined;
      fancy?: boolean;
    }
  | {
      name: string;
      onClick: () => Promise<undefined>;
      href?: undefined;
      fancy?: boolean;
    };

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  likes: number;
  readTimeMins: number;
  published: string | null;
  updatedAt: string;
  userId: string;
}
