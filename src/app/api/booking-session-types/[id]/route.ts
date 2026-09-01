import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { bookingSessionTypesCol } from "@/lib/firestore-collections";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const { name, durationMinutes, description } = await request.json();
  if (!name || typeof durationMinutes !== "number" || durationMinutes <= 0) {
    return NextResponse.json({ error: "name and a positive durationMinutes are required" }, { status: 400 });
  }

  await bookingSessionTypesCol().doc(id).update({ name, durationMinutes, description: description || null });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  // Self-booking always needs at least one selectable type, or the public
  // picker has nothing to offer — refuse to delete the last one.
  const countSnap = await bookingSessionTypesCol().count().get();
  if (countSnap.data().count <= 1) {
    return NextResponse.json({ error: "At least one session type is required." }, { status: 400 });
  }

  await bookingSessionTypesCol().doc(id).delete();
  return NextResponse.json({ ok: true });
}
