import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { questionnaireTemplatesCol } from "@/lib/firestore-collections";
import type { QuestionnaireQuestion } from "@/types/firestore";

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

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
  if (questions.some((q) => !q.label?.trim())) {
    return NextResponse.json({ error: "Every question needs a label" }, { status: 400 });
  }

  const docRef = await questionnaireTemplatesCol().add({
    name,
    title,
    questions,
    createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
  });

  return NextResponse.json({ ok: true, id: docRef.id });
}
