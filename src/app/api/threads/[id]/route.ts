import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { threadsCol } from "@/lib/firestore-collections";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const { status } = await request.json();
  if (status !== "open" && status !== "closed") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await threadsCol().doc(id).update({ status });
  return NextResponse.json({ ok: true });
}
