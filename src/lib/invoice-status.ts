import type { Timestamp } from "firebase-admin/firestore";
import type { InvoiceStatus } from "@/types/firestore";

/**
 * "overdue" is never written to Firestore — it's derived here at render
 * time from a sent invoice's due date, so there's no cron job needed to
 * keep it in sync.
 */
export function displayInvoiceStatus(invoice: { status: InvoiceStatus; dueDate: Timestamp }): InvoiceStatus {
  if (invoice.status === "sent" && invoice.dueDate.toDate() < new Date()) {
    return "overdue";
  }
  return invoice.status;
}
