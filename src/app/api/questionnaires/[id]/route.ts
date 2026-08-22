import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { questionnairesCol } from "@/lib/firestore-collections";
import type { QuestionnaireAnswer } from "@/types/firestore";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const questionnaireRef = questionnairesCol().doc(id);
  const snap = await questionnaireRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Questionnaire not found" }, { status: 404 });
  }
  if (snap.data()!.status !== "draft") {
    return NextResponse.json({ error: "Only draft questionnaires can be edited" }, { status: 400 });
  }

  const { title, answers } = (await request.json()) as { title: string; answers: QuestionnaireAnswer[] };
  if (!title || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json(
      { error: "title and at least one question are required" },
      { status: 400 }
    );
  }

  await questionnaireRef.update({ title, answers });
  return NextResponse.json({ ok: true });
}
