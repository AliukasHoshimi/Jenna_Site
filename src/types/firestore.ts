import type { Timestamp } from "firebase-admin/firestore";

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

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

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
  stripeCheckoutSessionId: string | null;
  stripeCheckoutUrl: string | null;
  dueDate: Timestamp;
  createdAt: Timestamp;
  sentAt: Timestamp | null;
  paidAt: Timestamp | null;
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
