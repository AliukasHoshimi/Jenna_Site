import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { templatesCol } from "@/lib/firestore-collections";

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { name, subject, body } = await request.json();
  if (!name || !subject || !body) {
    return NextResponse.json({ error: "name, subject, and body are required" }, { status: 400 });
  }

  const docRef = await templatesCol().add({
    name,
    subject,
    body,
    createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
  });

  return NextResponse.json({ ok: true, id: docRef.id });
}
