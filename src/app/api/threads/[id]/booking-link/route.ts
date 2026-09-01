import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { requireAuth } from "@/lib/auth/require-auth";
import { threadsCol } from "@/lib/firestore-collections";

// Idempotent: returns the thread's existing bookingToken if it already has
// one (so re-clicking "Send booking link" reuses the same link), otherwise
// generates and stores a new one. crypto.randomUUID() matches the
// signToken/respondToken pattern used by contracts/questionnaires.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const threadRef = threadsCol().doc(id);
  const threadSnap = await threadRef.get();
  if (!threadSnap.exists) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  let token = threadSnap.data()!.bookingToken;
  if (!token) {
    token = crypto.randomUUID();
    await threadRef.update({ bookingToken: token });
  }

  return NextResponse.json({ ok: true, token, url: `${request.nextUrl.origin}/book/${token}` });
}
