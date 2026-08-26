import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { adminDb } from "@/lib/firebase/admin";
import { questionnairesCol } from "@/lib/firestore-collections";

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const payload = await request.json().catch(() => null);
  const { ids, archived } = (payload ?? {}) as { ids?: string[]; archived?: boolean };
  if (!Array.isArray(ids) || ids.length === 0 || typeof archived !== "boolean") {
    return NextResponse.json({ error: "ids (non-empty array) and archived (boolean) are required" }, { status: 400 });
  }

  const batch = adminDb().batch();
  for (const id of ids) {
    batch.update(questionnairesCol().doc(id), {
      archivedAt: archived ? FieldValue.serverTimestamp() : null,
    });
  }
  await batch.commit();

  return NextResponse.json({ ok: true, count: ids.length });
}
