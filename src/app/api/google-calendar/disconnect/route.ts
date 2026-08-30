import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { googleCalendarSettingsDoc } from "@/lib/firestore-collections";

export async function POST() {
  const { user, response } = await requireAuth();
  if (!user) return response;

  await googleCalendarSettingsDoc().delete();
  return NextResponse.json({ ok: true });
}
