import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { contractsCol, contactsCol, messagesCol, threadsCol } from "@/lib/firestore-collections";
import { sendEmail } from "@/lib/mailgun";
import { renderEmailHtml } from "@/lib/email-html";
import { getOrCreateThreadReplyTo } from "@/lib/thread-reply";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const contractRef = contractsCol().doc(id);
  const contractSnap = await contractRef.get();
  if (!contractSnap.exists) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }
  const contract = contractSnap.data()!;
  if (contract.status !== "draft") {
    return NextResponse.json({ error: "Only draft contracts can be sent" }, { status: 400 });
  }

  const contactSnap = await contactsCol().doc(contract.contactId).get();
  const contact = contactSnap.data();
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const signUrl = `${request.nextUrl.origin}/sign/${contract.signToken}`;
  const emailText = `Hi ${contact.name},\n\nPlease review and sign your contract, "${contract.title}", here:\n${signUrl}\n\nThanks,\nJenna`;

  const { replyTo, threadId } = await getOrCreateThreadReplyTo({
    contactId: contract.contactId,
    threadId: contract.threadId,
    subject: contract.title,
  });

  try {
    await sendEmail({
      to: contact.email,
      from: `Jenna | Samsarafilmss <${process.env.MAILGUN_FROM_REPLIES}>`,
      subject: `Please sign: ${contract.title}`,
      text: emailText,
      html: renderEmailHtml(`Hi ${contact.name},\n\nPlease review and sign your contract, "${contract.title}."`, {
        ctaLabel: "Review & sign",
        ctaUrl: signUrl,
      }),
      replyTo,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not send contract" },
      { status: 502 }
    );
  }

  await contractRef.update({ status: "sent", sentAt: FieldValue.serverTimestamp(), threadId });

  await messagesCol(threadId).add({
    direction: "system",
    body: `Contract "${contract.title}" sent`,
    mailgunMessageId: null,
    createdAt: FieldValue.serverTimestamp(),
    linkHref: `/admin/contracts/${id}`,
  });
  await threadsCol().doc(threadId).update({ lastMessageAt: FieldValue.serverTimestamp() });

  return NextResponse.json({ ok: true, signUrl });
}
