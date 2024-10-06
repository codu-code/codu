import {
  generateEmailToken,
  sendVerificationEmail,
  storeTokenInDb,
} from "@/utils/emailToken";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
  const { userId, newEmail } = await req.json();

  if (!newEmail || !userId)
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });

  const token = generateEmailToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); //1 hour

  await storeTokenInDb(userId, token, expiresAt, newEmail);

  await sendVerificationEmail(newEmail, token);

  return NextResponse.json(
    { message: "Verification email sent" },
    { status: 200 },
  );
}
