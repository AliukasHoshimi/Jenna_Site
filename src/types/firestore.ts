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
  // Lazily generated the first time Jenna requests a portal link for this
  // contact; stable/reused after that. Public /portal/[token] resolves
  // straight to this contact — same idea as Thread.bookingToken.
  portalToken?: string | null;
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
  // Lazily generated the first time Jenna clicks "Send booking link" on
  // this thread; stable/reused after that. Public /book/[token] resolves
  // straight to this thread, same idea as replyToken for email threading.
  bookingToken?: string | null;
  // Free-text budget the lead typed on the marketing site's intake form
  // (optional field there too — a number, a range, or "not sure"). Scoped
  // per-thread rather than the contact, since the same person inquiring
  // again later could have an entirely different budget in mind.
  estimatedBudget?: string | null;
  // Independent of `status` (open/closed) — a bulk-cleanup tool, same
  // pattern as Invoice/Contract/Questionnaire archiving. Excluded from
  // the main Open/Closed views and from nav badge counts.
  archivedAt?: Timestamp | null;
}

export interface Message {
  direction: MessageDirection;
  body: string;
  mailgunMessageId: string | null;
  createdAt: Timestamp;
  // Optional admin-app deep link for "system" messages (e.g. a sent/signed/
  // completed notice linking to that invoice/contract/questionnaire's
  // detail page), so Jenna can click straight through from the thread.
  linkHref?: string | null;
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
export type InvoiceStatus = "draft" | "sent" | "deposit_paid" | "paid" | "overdue" | "balance_due";

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
  // When the balance invoice should go out once the deposit's paid — set at
  // creation time alongside depositAmount, null for non-deposit invoices.
  // Purely a nudge for Jenna (see displayInvoiceStatus); the balance is
  // still sent manually, same as every other outbound invoice.
  balanceDueDate: Timestamp | null;
  archivedAt: Timestamp | null;
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
  archivedAt: Timestamp | null;
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
  archivedAt: Timestamp | null;
}

// Singleton doc (settings/googleCalendar) holding the refresh token from
// Jenna's one-time OAuth consent. Google Calendar itself stays the source
// of truth for events — this just lets the server mint access tokens
// without her re-authenticating on every request.
export interface GoogleCalendarSettings {
  refreshToken: string;
  connectedEmail: string;
  connectedAt: Timestamp;
}

// A thin index over the real Google Calendar event, so the admin UI can
// list/link events by contact without re-parsing Calendar API responses.
export interface CalendarEvent {
  googleEventId: string;
  contactId: string | null;
  threadId: string | null;
  title: string;
  description: string | null;
  start: Timestamp;
  end: Timestamp;
  htmlLink: string;
  createdAt: Timestamp;
}

// "approving"/"cancelling" are short-lived transactional states used only
// inside their respective endpoint's status-guard transaction — each exists
// specifically to make a double-click (or two open tabs/requests) racing
// the same request impossible, by giving the second attempt a non-source
// status to bounce off before either touches Google Calendar.
export type BookingRequestStatus =
  | "pending"
  | "approving"
  | "approved"
  | "declined"
  | "expired"
  | "cancelled"
  | "cancelling";

// One doc per client slot-request attempt submitted through a thread's
// /book/[token] link (see Thread.bookingToken) — not one doc per link, since
// the same link can be reused across multiple attempts (e.g. after a
// decline). Approving a request creates a real CalendarEvent; the request
// doc itself is never the source of truth for what's on the calendar.
export interface BookingRequest {
  contactId: string;
  threadId: string;
  requestedStart: Timestamp;
  requestedEnd: Timestamp;
  clientNote: string | null;
  // Snapshotted at request time (id + name), same reasoning as
  // QuestionnaireAnswer snapshotting a question's label — editing or
  // removing a session type later shouldn't retroactively change what an
  // already-submitted request says it was for.
  sessionTypeId: string;
  sessionTypeName: string;
  status: BookingRequestStatus;
  // Written immediately after the Google Calendar insert succeeds, before
  // any other follow-up write — lets a retry (or manual inspection) tell a
  // real event already exists and must not be inserted a second time.
  googleEventId: string | null;
  // The mirror CalendarEvent doc id, written once that doc is created.
  calendarEventId: string | null;
  createdAt: Timestamp;
  // createdAt + the request-expiry window; a still-"pending" request past
  // this is treated as non-blocking by the availability engine even before
  // the expiry cron formally flips its status.
  expiresAt: Timestamp;
  respondedAt: Timestamp | null;
}

// One selectable visit type on the public booking page (e.g. "Mini session
// — 30 min", "Full session — 2 hr"). Its own collection (bookingSessionTypes)
// rather than an array on BookingSettings — matches every other preset
// list in this app (one doc per item), edited from the Templates hub.
// The Firestore doc id is the stable identifier BookingRequest.sessionTypeId
// references, same as Template/ContractTemplate/etc. don't self-store an id.
export interface BookingSessionType {
  name: string;
  durationMinutes: number;
  description: string | null;
  createdAt: Timestamp;
}

// Singleton doc (settings/booking). Falls back to sensible hardcoded
// defaults (see DEFAULT_BOOKING_SETTINGS in booking-availability.ts) when
// this doc doesn't exist yet, so self-booking works before Jenna ever visits
// the settings page.
export interface BookingSettings {
  // IANA zone, e.g. "America/New_York" — working hours are anchored here,
  // not to the server's UTC clock or a viewer's browser zone.
  timezone: string;
  bufferMinutes: number;
  minNoticeHours: number;
  bookingWindowDays: number;
  requestExpiryHours: number;
  // Kill switch — lets Jenna pause new booking requests without
  // disconnecting Google Calendar or invalidating already-sent links.
  bookingEnabled: boolean;
  // 0 = Sunday .. 6 = Saturday, "HH:mm" 24h local time. Absent = not bookable.
  workingHours: Partial<Record<number, { start: string; end: string }>>;
}

// One preset description a line item on a new invoice can be filled from
// (grouped by `group` in the picker, e.g. "Session fees", "Add-ons").
export interface InvoiceLineItemPreset {
  group: string;
  description: string;
  createdAt: Timestamp;
}
