import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { contactsCol, threadsCol, messagesCol } from "@/lib/firestore-collections";
import { sendEmail, verifyMailgunSignature } from "@/lib/mailgun";

function extractReplyToken(recipient: string): string | null {
  const match = recipient.match(/^reply\+([^@]+)@/i);
  return match ? match[1] : null;
}

function extractEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return (match ? match[1] : raw).trim().toLowerCase();
}

function extractName(raw: string, fallbackEmail: string): string {
  const match = raw.match(/^"?([^"<]+)"?\s*<[^>]+>/);
  return match ? match[1].trim() : fallbackEmail;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();

  const timestamp = String(form.get("timestamp") ?? "");
  const token = String(form.get("token") ?? "");
  const signature = String(form.get("signature") ?? "");

  // Never trust the payload before the signature checks out.
  if (!timestamp || !token || !signature || !verifyMailgunSignature(timestamp, token, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const sender = String(form.get("from") ?? form.get("sender") ?? "");
  const recipient = String(form.get("recipient") ?? "");
  const subject = String(form.get("subject") ?? "(no subject)");
  // Prefer Mailgun's "stripped-text" (quoted reply history and signatures
  // removed) over the raw "body-plain", which includes the entire quoted
  // chain and would otherwise clutter every reply in the thread view.
  const bodyPlain = String(form.get("stripped-text") ?? form.get("body-plain") ?? "");
  const messageId = form.get("Message-Id") ? String(form.get("Message-Id")) : null;

  const senderEmail = extractEmail(sender);
  const senderName = extractName(sender, senderEmail);
  if (!senderEmail) {
    return NextResponse.json({ error: "Missing sender" }, { status: 400 });
  }

  const replyToken = extractReplyToken(recipient);

  let threadId: string | null = null;
  let contactId: string | null = null;

  if (replyToken) {
    const threadSnap = await threadsCol().where("replyToken", "==", replyToken).limit(1).get();
    if (!threadSnap.empty) {
      threadId = threadSnap.docs[0].id;
      contactId = threadSnap.docs[0].data().contactId;
    }
  }

  if (!contactId) {
    const contactSnap = await contactsCol().where("email", "==", senderEmail).limit(1).get();
    if (!contactSnap.empty) {
      contactId = contactSnap.docs[0].id;
      await contactsCol().doc(contactId).update({ lastActivityAt: FieldValue.serverTimestamp() });
    } else {
      const newContact = await contactsCol().add({
        name: senderName,
        email: senderEmail,
        phone: null,
        instagram: null,
        source: "email",
        createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
        lastActivityAt: FieldValue.serverTimestamp() as unknown as Timestamp,
      });
      contactId = newContact.id;
    }
  } else {
    await contactsCol().doc(contactId).update({ lastActivityAt: FieldValue.serverTimestamp() });
  }

  if (!threadId) {
    const newThread = await threadsCol().add({
      contactId,
      subject,
      status: "open",
      replyToken: crypto.randomUUID(),
      createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
      lastMessageAt: FieldValue.serverTimestamp() as unknown as Timestamp,
    });
    threadId = newThread.id;
  }

  await messagesCol(threadId).add({
    direction: "inbound",
    body: bodyPlain,
    mailgunMessageId: messageId,
    createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
  });

  await threadsCol().doc(threadId).update({
    lastMessageAt: FieldValue.serverTimestamp(),
    lastMessageDirection: "inbound",
    status: "open",
  });

  // Nice-to-have: let Jenna know without needing the dashboard open.
  const notifyTo = process.env.NOTIFY_EMAIL;
  if (notifyTo) {
    await sendEmail({
      to: notifyTo,
      from: `Studio <${process.env.MAILGUN_FROM_REPLIES}>`,
      subject: `New message: ${subject}`,
      text: `${senderName} <${senderEmail}> wrote:\n\n${bodyPlain}\n\nOpen Studio to reply.`,
      replyTo: notifyTo,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, threadId, contactId });
}
