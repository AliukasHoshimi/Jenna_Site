import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { threadsCol, contactsCol, messagesCol } from "@/lib/firestore-collections";
import { sendEmail, replyAddressForToken } from "@/lib/mailgun";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id: threadId } = await params;
  const { body } = await request.json();
  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "Message body is required" }, { status: 400 });
  }

  const threadRef = threadsCol().doc(threadId);
  const threadSnap = await threadRef.get();
  if (!threadSnap.exists) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }
  const thread = threadSnap.data()!;

  const contactSnap = await contactsCol().doc(thread.contactId).get();
  const contact = contactSnap.data();
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const lastInboundSnap = await messagesCol(threadId)
    .where("direction", "==", "inbound")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();
  const lastInboundMessageId = lastInboundSnap.empty
    ? undefined
    : lastInboundSnap.docs[0].data().mailgunMessageId ?? undefined;

  let mailgunMessageId: string | null = null;
  try {
    const sendResult = await sendEmail({
      to: contact.email,
      from: `Jenna | Samsarafilmss <${process.env.MAILGUN_FROM_REPLIES}>`,
      subject: thread.subject,
      text: body,
      replyTo: replyAddressForToken(thread.replyToken),
      inReplyTo: lastInboundMessageId,
      references: lastInboundMessageId,
    });
    mailgunMessageId = (sendResult as { id?: string }).id ?? null;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not send email" },
      { status: 502 }
    );
  }

  await messagesCol(threadId).add({
    direction: "outbound",
    body,
    mailgunMessageId,
    createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
  });

  await threadRef.update({ lastMessageAt: FieldValue.serverTimestamp() });

  return NextResponse.json({ ok: true });
}
