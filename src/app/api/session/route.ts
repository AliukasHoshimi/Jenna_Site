import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

const SESSION_EXPIRES_IN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days — Firebase's max

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();
  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  try {
    // checkRevoked: reject a stale ID token so a cookie can't be minted from
    // a session that's already been signed out elsewhere.
    const decoded = await adminAuth().verifyIdToken(idToken, true);

    // Google sign-in creates a new Firebase user for *any* Google account on
    // first login — without this check, anyone with a Gmail address could
    // sign in and get an admin session. Email/password can't self-register
    // (no public sign-up page), so this only bites the Google path today,
    // but checking both keeps a single choke point.
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || decoded.email?.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json({ error: "This account isn't authorized." }, { status: 403 });
    }

    const sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN_MS,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_EXPIRES_IN_MS / 1000,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
