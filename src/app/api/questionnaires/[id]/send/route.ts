import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { questionnairesCol, contactsCol, threadsCol } from "@/lib/firestore-collections";
import { sendEmail, replyAddressForToken } from "@/lib/mailgun";
import { renderEmailHtml } from "@/lib/email-html";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const questionnaireRef = questionnairesCol().doc(id);
  const snap = await questionnaireRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Questionnaire not found" }, { status: 404 });
  }
  const questionnaire = snap.data()!;
  if (questionnaire.status !== "draft") {
    return NextResponse.json({ error: "Only draft questionnaires can be sent" }, { status: 400 });
  }

  const contactSnap = await contactsCol().doc(questionnaire.contactId).get();
  const contact = contactSnap.data();
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const respondUrl = `${request.nextUrl.origin}/respond/${questionnaire.respondToken}`;

  let replyTo = `Jenna | Samsarafilmss <${process.env.MAILGUN_FROM_REPLIES}>`;
  if (questionnaire.threadId) {
    const threadSnap = await threadsCol().doc(questionnaire.threadId).get();
    const thread = threadSnap.data();
    if (thread) replyTo = replyAddressForToken(thread.replyToken);
  }

  try {
    await sendEmail({
      to: contact.email,
      from: `Jenna | Samsarafilmss <${process.env.MAILGUN_FROM_REPLIES}>`,
      subject: `A few questions: ${questionnaire.title}`,
      text: `Hi ${contact.name},\n\nCould you take a couple minutes to fill this out?\n"${questionnaire.title}"\n${respondUrl}\n\nThanks,\nJenna`,
      html: renderEmailHtml(`Hi ${contact.name},\n\nCould you take a couple minutes to fill this out: "${questionnaire.title}"?`, {
        ctaLabel: "Answer questions",
        ctaUrl: respondUrl,
      }),
      replyTo,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not send questionnaire" },
      { status: 502 }
    );
  }

  await questionnaireRef.update({ status: "sent", sentAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ ok: true, respondUrl });
}
