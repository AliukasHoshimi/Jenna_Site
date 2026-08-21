import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { templatesCol } from "@/lib/firestore-collections";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const { name, subject, body } = await request.json();
  if (!name || !subject || !body) {
    return NextResponse.json({ error: "name, subject, and body are required" }, { status: 400 });
  }

  await templatesCol().doc(id).update({ name, subject, body });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  await templatesCol().doc(id).delete();
  return NextResponse.json({ ok: true });
}
