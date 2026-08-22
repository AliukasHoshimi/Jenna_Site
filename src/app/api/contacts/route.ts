import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { contactsCol } from "@/lib/firestore-collections";

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const payload = await request.json();
  const { name, email, phone, instagram, source } = payload;
  if (!name || !email) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }

  const docRef = await contactsCol().add({
    name,
    email: String(email).toLowerCase(),
    phone: phone || null,
    instagram: instagram || null,
    source: source || "manual",
    createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
    lastActivityAt: FieldValue.serverTimestamp() as unknown as Timestamp,
  });

  return NextResponse.json({ ok: true, id: docRef.id });
}
