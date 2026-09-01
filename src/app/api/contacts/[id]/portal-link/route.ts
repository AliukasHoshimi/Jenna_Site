import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { requireAuth } from "@/lib/auth/require-auth";
import { contactsCol } from "@/lib/firestore-collections";

// Idempotent, same pattern as /api/threads/[id]/booking-link — returns the
// contact's existing portalToken if it already has one, otherwise generates
// and stores a new one.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const contactRef = contactsCol().doc(id);
  const contactSnap = await contactRef.get();
  if (!contactSnap.exists) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  let token = contactSnap.data()!.portalToken;
  if (!token) {
    token = crypto.randomUUID();
    await contactRef.update({ portalToken: token });
  }

  return NextResponse.json({ ok: true, token, url: `${request.nextUrl.origin}/portal/${token}` });
}
