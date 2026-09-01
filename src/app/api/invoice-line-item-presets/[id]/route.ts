import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { invoiceLineItemPresetsCol } from "@/lib/firestore-collections";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const { group, description } = await request.json();
  if (!group || !description) {
    return NextResponse.json({ error: "group and description are required" }, { status: 400 });
  }

  await invoiceLineItemPresetsCol().doc(id).update({ group, description });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  await invoiceLineItemPresetsCol().doc(id).delete();
  return NextResponse.json({ ok: true });
}
