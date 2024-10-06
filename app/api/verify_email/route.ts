import {
  deleteTokenFromDb,
  getTokenFromDb,
  updateEmail,
} from "@/utils/emailToken";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
  const token = req.nextUrl.searchParams.get("token");
  const { userId } = await req.json();

  if (!token)
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });

  const tokenFromDb = await getTokenFromDb(token, userId);

  console.log("tokenFromDb", tokenFromDb);
  if (!tokenFromDb.length)
    return NextResponse.json({ message: "Invalid token" }, { status: 400 });

  const { expiresAt, email } = tokenFromDb[0];
  if (expiresAt < new Date())
    return NextResponse.json({ message: "Token expired" }, { status: 400 });

  await updateEmail(userId, email);

  await deleteTokenFromDb(token);

  return NextResponse.json(
    { message: "Email successfully verified" },
    { status: 200 },
  );
}
