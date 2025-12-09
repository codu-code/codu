import type { DefaultSession } from "next-auth";

type Role = "USER" | "ADMIN" | "MODERATOR";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `auth()` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      role: Role;
      username: string;
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    username?: string;
    role: Role;
    id: string;
  }
}
