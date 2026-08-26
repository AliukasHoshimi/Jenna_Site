import type { Timestamp } from "firebase-admin/firestore";
import type { InvoiceStatus } from "@/types/firestore";

/**
 * "overdue" and "balance_due" are never written to Firestore — they're
 * derived here at render time (from a sent invoice's due date, or a
 * deposit-paid invoice's balanceDueDate), so there's no cron job needed to
 * keep them in sync.
 */
export function displayInvoiceStatus(invoice: {
  status: InvoiceStatus;
  dueDate: Timestamp;
  balanceDueDate?: Timestamp | null;
}): InvoiceStatus {
  if (invoice.status === "sent" && invoice.dueDate.toDate() < new Date()) {
    return "overdue";
  }
  if (invoice.status === "deposit_paid" && invoice.balanceDueDate && invoice.balanceDueDate.toDate() < new Date()) {
    return "balance_due";
  }
  return invoice.status;
}
