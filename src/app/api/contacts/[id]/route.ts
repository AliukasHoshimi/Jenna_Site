import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { contactsCol } from "@/lib/firestore-collections";

// Email is deliberately not editable here — it's the lookup key inbound
// mail and the marketing site's intake route match contacts by.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const { name, phone, instagram, source } = await request.json();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  await contactsCol().doc(id).update({
    name,
    phone: phone || null,
    instagram: instagram || null,
    source: source || "manual",
  });
  return NextResponse.json({ ok: true });
}
