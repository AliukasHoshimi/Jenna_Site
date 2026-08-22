// One-off script to seed Firestore with manually-inserted test data, per
// Phase 2 of the build brief: verify the contacts/threads/templates/invoices
// UI against real (but fake) data before wiring real Mailgun/Stripe.
//
// Usage: node scripts/seed.mjs
// Reads FIREBASE_SERVICE_ACCOUNT_KEY from .env.local (not process env),
// since this runs outside Next.js's own env loading.

import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

function loadEnvLocal() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

const env = loadEnvLocal();
const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const d = (iso) => Timestamp.fromDate(new Date(iso));

async function main() {
  console.log("Seeding contacts...");
  const contacts = {
    maya: {
      name: "Maya Chen",
      email: "maya.chen@example.com",
      phone: "+1 555-0142",
      instagram: "@mayaadventures",
      source: "Instagram DM",
      createdAt: d("2026-08-18T14:00:00Z"),
    },
    whitfield: {
      name: "Tom & Ellie Whitfield",
      email: "tom.whitfield@example.com",
      phone: "+1 555-0198",
      instagram: null,
      source: "Website contact form",
      createdAt: d("2026-07-10T09:30:00Z"),
    },
    priya: {
      name: "Priya Anand",
      email: "priya.anand@example.com",
      phone: null,
      instagram: "@priya.explores",
      source: "Referral",
      createdAt: d("2026-06-01T11:00:00Z"),
    },
  };

  const contactRefs = {};
  for (const [key, data] of Object.entries(contacts)) {
    const ref = db.collection("contacts").doc();
    await ref.set(data);
    contactRefs[key] = ref;
    console.log(`  contact: ${data.name} (${ref.id})`);
  }

  console.log("Seeding threads + messages...");

  // Thread 1: open, a few messages back and forth.
  const thread1 = db.collection("threads").doc();
  await thread1.set({
    contactId: contactRefs.maya.id,
    subject: "Adventure elopement shoot — Smoky Mountains",
    status: "open",
    replyToken: randomUUID(),
    createdAt: d("2026-08-18T14:05:00Z"),
    lastMessageAt: d("2026-08-20T16:45:00Z"),
  });
  const thread1Messages = [
    {
      direction: "inbound",
      body: "Hi! We're planning a sunrise elopement in the Smokies next spring and love your adventure work. Do you have availability in April, and what would a half-day session run?",
      mailgunMessageId: "seed-msg-1",
      createdAt: d("2026-08-18T14:05:00Z"),
    },
    {
      direction: "outbound",
      body: "Hey Maya!\n\nApril is looking open so far — a half-day adventure elopement session is $850 and includes full trail access, all edited images, and a same-week sneak peek!:) Want me to pencil in a date?\n\nCheers,\nJenna",
      mailgunMessageId: "seed-msg-2",
      createdAt: d("2026-08-19T10:15:00Z"),
    },
    {
      direction: "inbound",
      body: "That sounds perfect — could we do April 18th? Also wondering if you'd be up for a shorter hike-in this time, maybe 2 miles instead of 5?",
      mailgunMessageId: "seed-msg-3",
      createdAt: d("2026-08-20T16:45:00Z"),
    },
  ];
  for (const msg of thread1Messages) {
    await thread1.collection("messages").doc().set(msg);
  }

  // Thread 2: closed, booked and wrapped up.
  const thread2 = db.collection("threads").doc();
  await thread2.set({
    contactId: contactRefs.whitfield.id,
    subject: "Wedding photography — September 2026",
    status: "closed",
    replyToken: randomUUID(),
    createdAt: d("2026-07-10T09:35:00Z"),
    lastMessageAt: d("2026-07-15T13:00:00Z"),
  });
  const thread2Messages = [
    {
      direction: "inbound",
      body: "Hi Jenna, we're getting married September 12th and are looking for a photographer for the full day. Are you available, and could you send over pricing?",
      mailgunMessageId: "seed-msg-4",
      createdAt: d("2026-07-10T09:35:00Z"),
    },
    {
      direction: "outbound",
      body: "Hey Tom and Ellie!\n\nCongratulations!! September 12th is open — full-day coverage (8 hours) with a second shooter is $2,800 total. I'll get an invoice sent over shortly so we can lock in your date!:)\n\nCheers,\nJenna",
      mailgunMessageId: "seed-msg-5",
      createdAt: d("2026-07-12T11:00:00Z"),
    },
    {
      direction: "inbound",
      body: "That works great for us, thank you! Just paid the invoice.",
      mailgunMessageId: "seed-msg-6",
      createdAt: d("2026-07-15T12:50:00Z"),
    },
    {
      direction: "system",
      body: "Invoice #1002 — paid, $2,800.00",
      mailgunMessageId: null,
      createdAt: d("2026-07-15T13:00:00Z"),
    },
  ];
  for (const msg of thread2Messages) {
    await thread2.collection("messages").doc().set(msg);
  }

  console.log("Seeding templates...");
  const templates = [
    {
      name: "Wedding inquiry response",
      subject: "Re: Your wedding inquiry!",
      body: "Hey {{client_name}}!\n\nI would absolutely love to capture your wedding day!:)\n\nWant to hop on a call sometime this weekend and chat more details? I'd love to hear more about what you're envisioning for the day!\n\nLet me know a time that would work best for you!\n\nCheers,\nJenna",
      createdAt: d("2026-01-15T00:00:00Z"),
    },
    {
      name: "Adventure/portrait inquiry response",
      subject: "Re: Your inquiry!",
      body: "Hey {{client_name}}!\n\nThank you so much for reaching out, this sounds like such a fun shoot!:)\n\nI'd love to hear more about what you're envisioning — do you have a date and location in mind yet? Once I know a bit more I can send over pricing and we can find a time that works!\n\nCheers,\nJenna",
      createdAt: d("2026-01-15T00:05:00Z"),
    },
    {
      name: "Pricing & availability",
      subject: "Pricing & availability!",
      body: "Hey {{client_name}}!\n\nHere's the rundown on pricing and what's included — let me know if this all sounds good and I'll get an invoice sent over so we can lock in your date!\n\nCheers,\nJenna",
      createdAt: d("2026-01-15T00:10:00Z"),
    },
    {
      name: "Booking confirmed",
      subject: "You're booked!! 🎉",
      body: "Hey {{client_name}}!\n\nYay, you're officially on the calendar!! I am so excited for this one!:)\n\nI'll be in touch as we get closer with a few details, but for now just relax — you're in good hands!\n\nCheers,\nJenna",
      createdAt: d("2026-01-15T00:15:00Z"),
    },
    {
      name: "Thank you / wrap-up",
      subject: "Thank you, {{client_name}}!!",
      body: "Hey {{client_name}}!\n\nIt was such a joy getting to work with you, thank you for having me!:)\n\nYour gallery will be ready within two weeks — I'll send a link the second it's live!\n\nCheers,\nJenna",
      createdAt: d("2026-01-15T00:20:00Z"),
    },
  ];
  for (const data of templates) {
    const ref = db.collection("templates").doc();
    await ref.set(data);
    console.log(`  template: ${data.name} (${ref.id})`);
  }

  console.log("Seeding invoices...");
  const invoiceSeeds = [
    {
      number: "1001",
      contactId: contactRefs.maya.id,
      threadId: thread1.id,
      lineItems: [{ description: "Adventure elopement session (4 hrs)", amount: 850 }],
      amountTotal: 850,
      status: "draft",
      stripeCheckoutSessionId: null,
      stripeCheckoutUrl: null,
      dueDate: d("2026-09-05T00:00:00Z"),
      createdAt: d("2026-08-20T17:00:00Z"),
      sentAt: null,
      paidAt: null,
    },
    {
      number: "1002",
      contactId: contactRefs.whitfield.id,
      threadId: thread2.id,
      lineItems: [
        { description: "Wedding day coverage (8 hrs)", amount: 2400 },
        { description: "Second shooter", amount: 400 },
      ],
      amountTotal: 2800,
      status: "paid",
      stripeCheckoutSessionId: "seed_test_cs_whitfield",
      stripeCheckoutUrl: "https://checkout.stripe.com/test/seed-placeholder-whitfield",
      dueDate: d("2026-07-26T00:00:00Z"),
      createdAt: d("2026-07-12T11:05:00Z"),
      sentAt: d("2026-07-12T11:05:00Z"),
      paidAt: d("2026-07-15T13:00:00Z"),
    },
    {
      number: "1003",
      contactId: contactRefs.priya.id,
      threadId: null,
      lineItems: [{ description: "Portrait session (1 hr)", amount: 300 }],
      amountTotal: 300,
      status: "sent",
      stripeCheckoutSessionId: "seed_test_cs_priya",
      stripeCheckoutUrl: "https://checkout.stripe.com/test/seed-placeholder-priya",
      dueDate: d("2026-06-15T00:00:00Z"),
      createdAt: d("2026-06-01T11:10:00Z"),
      sentAt: d("2026-06-01T11:10:00Z"),
      paidAt: null,
    },
  ];

  for (const { number, ...data } of invoiceSeeds) {
    const ref = db.collection("invoices").doc();
    await ref.set({ invoiceNumber: number, currency: "usd", ...data });
    console.log(`  invoice #${number}: ${data.status} (${ref.id})`);
  }

  // Keep the app's sequential invoice-number counter in sync so the next
  // real invoice created in the UI continues from 1004, not colliding with
  // these seeded numbers.
  await db.collection("counters").doc("invoices").set({ value: 1003 });

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
