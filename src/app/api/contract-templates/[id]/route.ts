import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { contractTemplatesCol } from "@/lib/firestore-collections";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const { name, title, body } = await request.json();
  if (!name || !title || !body) {
    return NextResponse.json({ error: "name, title, and body are required" }, { status: 400 });
  }

  await contractTemplatesCol().doc(id).update({ name, title, body });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  await contractTemplatesCol().doc(id).delete();
  return NextResponse.json({ ok: true });
}
