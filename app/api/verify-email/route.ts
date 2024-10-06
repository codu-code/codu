import { getServerAuthSession } from "@/server/auth";
import {
  deleteTokenFromDb,
  getTokenFromDb,
  updateEmail,
} from "@/utils/emailToken";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token)
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });

    const session = await getServerAuthSession();

    if (!session || !session.user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const tokenFromDb = await getTokenFromDb(token, session.user.id);

    if (!tokenFromDb.length)
      return NextResponse.json({ message: "Invalid token" }, { status: 400 });

    const { userId, expiresAt, email } = tokenFromDb[0];
    if (expiresAt < new Date())
      return NextResponse.json({ message: "Token expired" }, { status: 400 });

    await updateEmail(userId, email);

    await deleteTokenFromDb(token);

    return NextResponse.json(
      { message: "Email successfully verified" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
