import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { invoiceLineItemPresetsCol } from "@/lib/firestore-collections";

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { group, description } = await request.json();
  if (!group || !description) {
    return NextResponse.json({ error: "group and description are required" }, { status: 400 });
  }

  const docRef = await invoiceLineItemPresetsCol().add({
    group,
    description,
    createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
  });

  return NextResponse.json({ ok: true, id: docRef.id });
}
