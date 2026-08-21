import type { Timestamp } from "firebase-admin/firestore";

export interface Contact {
  name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  source: string;
  createdAt: Timestamp;
}

export type ThreadStatus = "open" | "closed";

export interface Thread {
  contactId: string;
  subject: string;
  status: ThreadStatus;
  replyToken: string;
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
}

// The brief's schema defines inbound/outbound; "system" is added so the
// paid-invoice notice (Section 4.D.7) has somewhere to live in the thread.
export type MessageDirection = "inbound" | "outbound" | "system";

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
