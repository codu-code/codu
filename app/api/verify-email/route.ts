import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import {
  emailChangeRequest,
  user,
  emailChangeHistory,
} from "@/server/db/schema";
import { and, eq, gte } from "drizzle-orm";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ message: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await getServerAuthSession();

    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;

    const request = await db.query.emailChangeRequest.findFirst({
      where: and(
        eq(emailChangeRequest.token, token),
        eq(emailChangeRequest.userId, userId),
        gte(emailChangeRequest.expiresAt, new Date()),
      ),
    });

    if (!request) {
      return new Response(
        JSON.stringify({ message: "Invalid or expired token" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!currentUser) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db
      .update(user)
      .set({
        email: request.newEmail,
        emailVerified: new Date().toISOString(),
      })
      .where(eq(user.id, userId));

    await db.insert(emailChangeHistory).values({
      userId,
      oldEmail: currentUser.email ?? "",
      newEmail: request.newEmail,
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    await db
      .delete(emailChangeRequest)
      .where(eq(emailChangeRequest.id, request.id));

    return new Response(
      JSON.stringify({ message: "Email updated successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error verifying email:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
