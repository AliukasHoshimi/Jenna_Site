import "server-only";
import crypto from "node:crypto";
import Mailgun from "mailgun.js";
import FormData from "form-data";

// mailgun.js only exposes its message-data type via deep subpaths blocked by
// its package.json "exports" map, so derive it structurally instead.
type MailgunClient = ReturnType<InstanceType<typeof Mailgun>["client"]>;
type MailgunMessageData = Parameters<MailgunClient["messages"]["create"]>[1];

function getDomain() {
  const domain = process.env.MAILGUN_DOMAIN;
  if (!domain) throw new Error("MAILGUN_DOMAIN is not set.");
  return domain;
}

function getClient() {
  const apiKey = process.env.MAILGUN_API_KEY;
  if (!apiKey) throw new Error("MAILGUN_API_KEY is not set.");
  const mailgun = new Mailgun(FormData);
  return mailgun.client({ username: "api", key: apiKey });
}

/** The threaded reply address a client's "reply" lands on for a given thread. */
export function replyAddressForToken(replyToken: string) {
  return `reply+${replyToken}@${getDomain()}`;
}

interface SendEmailInput {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
  replyTo: string;
  inReplyTo?: string;
  references?: string;
  attachment?: { filename: string; data: Buffer }[];
}

export async function sendEmail(input: SendEmailInput) {
  const client = getClient();
  const domain = getDomain();

  const message: MailgunMessageData = {
    from: input.from,
    to: [input.to],
    subject: input.subject,
    text: input.text,
    "h:Reply-To": input.replyTo,
  };

  if (input.html) message.html = input.html;
  if (input.inReplyTo) message["h:In-Reply-To"] = input.inReplyTo;
  if (input.references) message["h:References"] = input.references;
  if (input.attachment) message.attachment = input.attachment;

  return client.messages.create(domain, message);
}

/**
 * Verifies Mailgun's inbound webhook signature (HMAC-SHA256 of
 * timestamp+token, keyed with Mailgun's account-level HTTP webhook signing
 * key — a different secret from the per-domain sending API key). Reject
 * anything that doesn't validate before trusting the payload.
 */
export function verifyMailgunSignature(timestamp: string, token: string, signature: string) {
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
  if (!signingKey) return false;
  try {
    const expected = crypto.createHmac("sha256", signingKey).update(timestamp + token).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}
