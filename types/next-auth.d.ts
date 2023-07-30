import type { DefaultSession, DefaultUser } from "next-auth";

type Role = "USER" | "ADMIN" | "MODERATOR";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user?: {
      role: Role;
      username: string;
      id: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username: ?string;
    role: Role;
    id: string;
  }
}
