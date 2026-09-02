import "server-only";
import crypto from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { threadsCol } from "@/lib/firestore-collections";
import { replyAddressForToken } from "@/lib/mailgun";

/**
 * A Reply-To address that always lands back in a real thread. Reuses the
 * given thread if one exists; otherwise creates a minimal one (same shape
 * mailgun-inbound/route.ts uses for a brand-new sender) so a client's reply
 * always has somewhere correct to go, regardless of MAILGUN_FROM_REPLIES's
 * domain.
 */
export async function getOrCreateThreadReplyTo(params: {
  contactId: string;
  threadId: string | null;
  subject: string;
}): Promise<{ replyTo: string; threadId: string }> {
  if (params.threadId) {
    const snap = await threadsCol().doc(params.threadId).get();
    const thread = snap.data();
    if (thread) return { replyTo: replyAddressForToken(thread.replyToken), threadId: params.threadId };
  }
  const replyToken = crypto.randomUUID();
  const newThread = await threadsCol().add({
    contactId: params.contactId,
    subject: params.subject,
    status: "open",
    replyToken,
    createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
    lastMessageAt: FieldValue.serverTimestamp() as unknown as Timestamp,
  });
  return { replyTo: replyAddressForToken(replyToken), threadId: newThread.id };
}
