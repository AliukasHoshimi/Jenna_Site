import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { questionnairesCol } from "@/lib/firestore-collections";
import type { QuestionnaireAnswer } from "@/types/firestore";

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { contactId, threadId, title, answers } = (await request.json()) as {
    contactId: string;
    threadId?: string | null;
    title: string;
    answers: QuestionnaireAnswer[];
  };
  if (!contactId || !title || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json(
      { error: "contactId, title, and at least one question are required" },
      { status: 400 }
    );
  }

  const docRef = await questionnairesCol().add({
    contactId,
    threadId: threadId || null,
    title,
    answers: answers.map((a) => ({ ...a, answer: "" })),
    status: "draft",
    respondToken: crypto.randomUUID(),
    createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
    sentAt: null,
    completedAt: null,
  });

  return NextResponse.json({ ok: true, id: docRef.id });
}
