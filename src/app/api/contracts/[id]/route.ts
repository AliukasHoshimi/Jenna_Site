import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { contractsCol } from "@/lib/firestore-collections";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const contractRef = contractsCol().doc(id);
  const contractSnap = await contractRef.get();
  if (!contractSnap.exists) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }
  if (contractSnap.data()!.status !== "draft") {
    return NextResponse.json({ error: "Only draft contracts can be edited" }, { status: 400 });
  }

  const { title, body } = await request.json();
  if (!title || !body) {
    return NextResponse.json({ error: "title and body are required" }, { status: 400 });
  }

  await contractRef.update({ title, body });
  return NextResponse.json({ ok: true });
}
