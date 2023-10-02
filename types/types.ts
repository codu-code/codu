export type UserNavigationItem =
  | {
      name: string;
      href: string;
      onClick?: undefined;
    }
  | {
      name: string;
      onClick: () => Promise<undefined>;
      href?: undefined;
    };
