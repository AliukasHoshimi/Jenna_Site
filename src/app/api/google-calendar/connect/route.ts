import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const redirectUri = `${request.nextUrl.origin}/api/google-calendar/callback`;
  return NextResponse.redirect(getGoogleAuthUrl(redirectUri));
}
