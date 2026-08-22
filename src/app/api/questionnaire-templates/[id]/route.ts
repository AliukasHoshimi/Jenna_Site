import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { questionnaireTemplatesCol } from "@/lib/firestore-collections";
import type { QuestionnaireQuestion } from "@/types/firestore";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const { name, title, questions } = (await request.json()) as {
    name: string;
    title: string;
    questions: QuestionnaireQuestion[];
  };
  if (!name || !title || !Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json(
      { error: "name, title, and at least one question are required" },
      { status: 400 }
    );
  }

  await questionnaireTemplatesCol().doc(id).update({ name, title, questions });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  await questionnaireTemplatesCol().doc(id).delete();
  return NextResponse.json({ ok: true });
}
