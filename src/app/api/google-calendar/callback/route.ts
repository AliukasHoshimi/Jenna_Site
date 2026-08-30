import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { googleCalendarSettingsDoc } from "@/lib/firestore-collections";
import { exchangeCodeForConnection } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  if (error || !code) {
    return NextResponse.redirect(`${origin}/admin/calendar?error=1`);
  }

  try {
    const redirectUri = `${origin}/api/google-calendar/callback`;
    const { refreshToken, email } = await exchangeCodeForConnection(code, redirectUri);
    await googleCalendarSettingsDoc().set({
      refreshToken,
      connectedEmail: email,
      connectedAt: FieldValue.serverTimestamp() as unknown as Timestamp,
    });
  } catch (err) {
    console.error("Google Calendar OAuth callback failed:", err);
    return NextResponse.redirect(`${origin}/admin/calendar?error=1`);
  }

  return NextResponse.redirect(`${origin}/admin/calendar?connected=1`);
}
