import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { contactsCol } from "@/lib/firestore-collections";
import type { BookingStage } from "@/types/firestore";

const VALID_STAGES: BookingStage[] = ["inquiry", "booked", "active", "delivered"];

// Email is deliberately not editable here — it's the lookup key inbound
// mail and the marketing site's intake route match contacts by.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const { name, phone, instagram, source, bookingStage } = await request.json();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (bookingStage && !VALID_STAGES.includes(bookingStage)) {
    return NextResponse.json({ error: "Invalid booking stage" }, { status: 400 });
  }

  await contactsCol().doc(id).update({
    name,
    phone: phone || null,
    instagram: instagram || null,
    source: source || "manual",
    ...(bookingStage ? { bookingStage } : {}),
  });
  return NextResponse.json({ ok: true });
}
