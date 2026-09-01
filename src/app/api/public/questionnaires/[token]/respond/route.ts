import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { questionnairesCol, messagesCol, threadsCol } from "@/lib/firestore-collections";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { answers } = (await request.json().catch(() => ({}))) as {
    answers?: { questionId: string; answer: string }[];
  };
  if (!Array.isArray(answers)) {
    return NextResponse.json({ error: "Answers are required" }, { status: 400 });
  }

  const snap = await questionnairesCol().where("respondToken", "==", token).limit(1).get();
  if (snap.empty) {
    return NextResponse.json({ error: "Questionnaire not found" }, { status: 404 });
  }
  const doc = snap.docs[0];
  const questionnaire = doc.data();

  if (questionnaire.status === "completed") {
    return NextResponse.json({ error: "This questionnaire has already been completed." }, { status: 400 });
  }
  if (questionnaire.status !== "sent") {
    return NextResponse.json({ error: "This questionnaire isn't ready to be answered yet." }, { status: 400 });
  }

  const answersByQuestionId = new Map(answers.map((a) => [a.questionId, a.answer ?? ""]));
  const updatedAnswers = questionnaire.answers.map((a) => ({
    ...a,
    answer: answersByQuestionId.get(a.questionId) ?? "",
  }));

  await doc.ref.update({
    answers: updatedAnswers,
    status: "completed",
    completedAt: FieldValue.serverTimestamp(),
  });

  if (questionnaire.threadId) {
    await messagesCol(questionnaire.threadId).add({
      direction: "system",
      body: `Questionnaire "${questionnaire.title}" — completed`,
      mailgunMessageId: null,
      createdAt: FieldValue.serverTimestamp(),
      linkHref: `/admin/questionnaires/${doc.id}`,
    });
    await threadsCol().doc(questionnaire.threadId).update({ lastMessageAt: FieldValue.serverTimestamp() });
  }

  return NextResponse.json({ ok: true });
}
