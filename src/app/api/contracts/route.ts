import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { contractsCol } from "@/lib/firestore-collections";

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { contactId, threadId, title, body } = await request.json();
  if (!contactId || !title || !body) {
    return NextResponse.json({ error: "contactId, title, and body are required" }, { status: 400 });
  }

  const docRef = await contractsCol().add({
    contactId,
    threadId: threadId || null,
    title,
    body,
    status: "draft",
    signToken: crypto.randomUUID(),
    signerName: null,
    signedAt: null,
    signedIp: null,
    createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
    sentAt: null,
  });

  return NextResponse.json({ ok: true, id: docRef.id });
}
