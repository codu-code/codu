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
