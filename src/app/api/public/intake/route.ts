import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { contactsCol, threadsCol, messagesCol } from "@/lib/firestore-collections";

/**
 * Public intake endpoint for the marketing site's contact form. This is
 * meant to be called server-to-server (the marketing site's own form
 * handler POSTs here), not directly from the client's browser — that's why
 * auth is a shared secret header rather than a Firebase session, and why
 * INTAKE_API_SECRET must never be embedded in the marketing site's
 * client-side JS.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.INTAKE_API_SECRET;
  if (!secret || request.headers.get("x-intake-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload.email !== "string" || typeof payload.message !== "string") {
    return NextResponse.json({ error: "email and message are required" }, { status: 400 });
  }

  const email = payload.email.trim().toLowerCase();
  const name = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : email;
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : null;
  const instagram = typeof payload.instagram === "string" ? payload.instagram.trim() : null;
  const source = typeof payload.source === "string" ? payload.source : "website";

  const existingContact = await contactsCol().where("email", "==", email).limit(1).get();
  let contactId: string;
  if (!existingContact.empty) {
    contactId = existingContact.docs[0].id;
    await contactsCol().doc(contactId).update({ lastActivityAt: FieldValue.serverTimestamp() });
  } else {
    const newContact = await contactsCol().add({
      name,
      email,
      phone,
      instagram,
      source,
      createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
      lastActivityAt: FieldValue.serverTimestamp() as unknown as Timestamp,
      bookingStage: "inquiry",
    });
    contactId = newContact.id;
  }

  const newThread = await threadsCol().add({
    contactId,
    subject: "Website Inquiry",
    status: "open",
    replyToken: crypto.randomUUID(),
    createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
    lastMessageAt: FieldValue.serverTimestamp() as unknown as Timestamp,
    lastMessageDirection: "inbound",
  });

  await messagesCol(newThread.id).add({
    direction: "inbound",
    body: payload.message,
    mailgunMessageId: null,
    createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
  });

  return NextResponse.json({ ok: true });
}
