import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { bookingSessionTypesCol } from "@/lib/firestore-collections";

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { name, durationMinutes, description } = await request.json();
  if (!name || typeof durationMinutes !== "number" || durationMinutes <= 0) {
    return NextResponse.json({ error: "name and a positive durationMinutes are required" }, { status: 400 });
  }

  const docRef = await bookingSessionTypesCol().add({
    name,
    durationMinutes,
    description: description || null,
    createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
  });

  return NextResponse.json({ ok: true, id: docRef.id });
}
