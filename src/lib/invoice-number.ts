import "server-only";
import { adminDb } from "@/lib/firebase/admin";

const COUNTER_DOC_ID = "invoices";
const START_AT = 1001;

/**
 * Sequential invoice numbers (1001, 1002, ...), assigned atomically via a
 * Firestore counter. This is a placeholder default — confirm the scheme
 * Jenna actually wants (sequential vs. date-based vs. custom prefix, see
 * Section 9 of the build brief) and adjust here if it changes.
 */
export async function nextInvoiceNumber(): Promise<string> {
  const ref = adminDb().collection("counters").doc(COUNTER_DOC_ID);
  const next = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = (snap.data()?.value as number | undefined) ?? START_AT - 1;
    const value = current + 1;
    tx.set(ref, { value }, { merge: true });
    return value;
  });
  return String(next);
}
