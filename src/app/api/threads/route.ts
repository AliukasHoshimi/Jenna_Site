import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { threadsCol } from "@/lib/firestore-collections";

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { contactId, subject } = await request.json();
  if (!contactId || !subject) {
    return NextResponse.json({ error: "contactId and subject are required" }, { status: 400 });
  }

  const docRef = await threadsCol().add({
    contactId,
    subject,
    status: "open",
    replyToken: crypto.randomUUID(),
    createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
    lastMessageAt: FieldValue.serverTimestamp() as unknown as Timestamp,
  });

  return NextResponse.json({ ok: true, id: docRef.id });
}
