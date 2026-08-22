import type { Timestamp } from "firebase-admin/firestore";

export type BookingStage = "inquiry" | "booked" | "active" | "delivered";

export interface Contact {
  name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  source: string;
  createdAt: Timestamp;
  // Most recent activity involving this contact (a thread message, or
  // creation if never messaged). Drives the invoice form's client sort.
  lastActivityAt: Timestamp;
  bookingStage: BookingStage;
}

export type ThreadStatus = "open" | "closed";

// The brief's schema defines inbound/outbound; "system" is added so the
// paid-invoice notice (Section 4.D.7) has somewhere to live in the thread.
export type MessageDirection = "inbound" | "outbound" | "system";

export interface Thread {
  contactId: string;
  subject: string;
  status: ThreadStatus;
  replyToken: string;
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
  // Direction of the most recent message, used to flag threads awaiting
  // Jenna's reply. Absent on threads created before this field existed.
  lastMessageDirection?: MessageDirection;
}

export interface Message {
  direction: MessageDirection;
  body: string;
  mailgunMessageId: string | null;
  createdAt: Timestamp;
}

export interface Template {
  name: string;
  subject: string;
  body: string;
  createdAt: Timestamp;
}

// "overdue" is derived at render time (see displayInvoiceStatus), never
// stored. "deposit_paid" sits between two "sent" states: sent (deposit
// checkout outstanding) -> deposit_paid -> sent (balance checkout
// outstanding, once Jenna sends it) -> paid.
export type InvoiceStatus = "draft" | "sent" | "deposit_paid" | "paid" | "overdue";

export interface LineItem {
  description: string;
  amount: number;
}

export interface Invoice {
  contactId: string;
  threadId: string | null;
  invoiceNumber: string;
  lineItems: LineItem[];
  amountTotal: number;
  currency: string;
  status: InvoiceStatus;
  // The currently-outstanding Stripe Checkout Session — the deposit's
  // session while awaiting deposit payment, then overwritten with the
  // balance's session once the balance invoice is sent.
  stripeCheckoutSessionId: string | null;
  stripeCheckoutUrl: string | null;
  dueDate: Timestamp;
  createdAt: Timestamp;
  sentAt: Timestamp | null;
  paidAt: Timestamp | null;
  // Throttles the overdue-reminder cron so it nudges periodically rather
  // than emailing the client every single day it stays unpaid.
  lastReminderSentAt: Timestamp | null;
  // Optional deposit-then-balance flow. Null depositAmount means this
  // invoice behaves exactly as a single full-amount invoice always has.
  depositAmount: number | null;
  depositPaidAt: Timestamp | null;
  depositStripeCheckoutSessionId: string | null;
}

export interface ContractTemplate {
  name: string;
  title: string;
  body: string;
  createdAt: Timestamp;
}

export type ContractStatus = "draft" | "sent" | "signed";

export interface Contract {
  contactId: string;
  threadId: string | null;
  title: string;
  body: string;
  status: ContractStatus;
  // Unique token for the public /sign/[token] link — same pattern as a
  // thread's replyToken.
  signToken: string;
  signerName: string | null;
  signedAt: Timestamp | null;
  signedIp: string | null;
  createdAt: Timestamp;
  sentAt: Timestamp | null;
}

export type QuestionType = "short" | "long";

export interface QuestionnaireQuestion {
  id: string;
  label: string;
  type: QuestionType;
}

export interface QuestionnaireTemplate {
  name: string;
  title: string;
  questions: QuestionnaireQuestion[];
  createdAt: Timestamp;
}

// Answers double as the question list on a live questionnaire — each
// snapshots the question's label/type at creation time (so editing a
// template later doesn't retroactively change one already sent), plus the
// client's answer once completed.
export interface QuestionnaireAnswer {
  questionId: string;
  label: string;
  type: QuestionType;
  answer: string;
}

export type QuestionnaireStatus = "draft" | "sent" | "completed";

export interface Questionnaire {
  contactId: string;
  threadId: string | null;
  title: string;
  answers: QuestionnaireAnswer[];
  status: QuestionnaireStatus;
  // Unique token for the public /respond/[token] link.
  respondToken: string;
  createdAt: Timestamp;
  sentAt: Timestamp | null;
  completedAt: Timestamp | null;
}
