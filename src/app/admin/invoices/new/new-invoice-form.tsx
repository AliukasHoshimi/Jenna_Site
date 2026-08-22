"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface ContactOption {
  id: string;
  name: string;
  email: string;
}

interface LineItemRow {
  description: string;
  amount: string;
}

const LINE_ITEM_PRESETS: { group: string; options: string[] }[] = [
  {
    group: "Session fees",
    options: [
      "Adventure elopement session (4 hrs)",
      "Half-day adventure session (4 hrs)",
      "Full-day adventure session (8 hrs)",
      "Portrait session (1 hr)",
      "Extended portrait session (2 hrs)",
      "Engagement session (1.5 hrs)",
      "Mini session (30 min)",
    ],
  },
  {
    group: "Wedding coverage",
    options: [
      "Wedding day coverage (8 hrs)",
      "Wedding day coverage (10 hrs)",
      "Elopement coverage (4 hrs)",
      "Rehearsal dinner coverage",
      "Second shooter (full day)",
    ],
  },
  {
    group: "Add-ons",
    options: [
      "Extra hour of coverage",
      "Second shooter (4 hrs)",
      "Drone / aerial add-on",
      "Rush editing (48-hour turnaround)",
      "Additional edited images (set of 10)",
      "Engagement session add-on",
    ],
  },
  {
    group: "Travel & logistics",
    options: ["Travel fee", "Mileage reimbursement", "Permit / location fee"],
  },
  {
    group: "Deliverables",
    options: [
      "Full digital gallery",
      "Printed album (8x8, 20 pages)",
      "USB drive, full-resolution images",
      "Canvas print (16x20)",
    ],
  },
];

// Native number-input spin buttons only step by whole increments of `step`,
// which is useless on dollar amounts (clicking 100 times to add a dollar) —
// hidden here rather than removing type="number" so mobile still gets a
// numeric keyboard.
const noSpinnerClass =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none";

export function NewInvoiceForm({
  contacts,
  defaultContactId,
}: {
  contacts: ContactOption[];
  defaultContactId?: string;
}) {
  const router = useRouter();
  const [contactId, setContactId] = useState(defaultContactId ?? "");
  const [dueDate, setDueDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItemRow[]>([{ description: "", amount: "" }]);
  const [depositAmount, setDepositAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLineItem(index: number, field: keyof LineItemRow, value: string) {
    setLineItems((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addLineItem() {
    setLineItems((rows) => [...rows, { description: "", amount: "" }]);
  }

  function removeLineItem(index: number) {
    setLineItems((rows) => rows.filter((_, i) => i !== index));
  }

  const total = lineItems.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!contactId || !dueDate) {
      setError("Pick a client and a due date.");
      return;
    }
    const parsedItems = lineItems
      .filter((row) => row.description.trim())
      .map((row) => ({ description: row.description.trim(), amount: parseFloat(row.amount) }));
    if (parsedItems.length === 0 || parsedItems.some((i) => !i.amount || i.amount <= 0)) {
      setError("Add at least one line item with a positive amount.");
      return;
    }
    const parsedDeposit = depositAmount.trim() ? parseFloat(depositAmount) : null;
    if (parsedDeposit != null && (!parsedDeposit || parsedDeposit <= 0 || parsedDeposit >= total)) {
      setError("Deposit must be a positive amount less than the total.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId,
        dueDate,
        lineItems: parsedItems,
        currency: "usd",
        depositAmount: parsedDeposit,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok && data.id) {
      router.push(`/admin/invoices/${data.id}`);
    } else {
      setError(data.error ?? "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-muted">Client</label>
        <select
          required
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="" disabled>
            Select a client…
          </option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Due date</label>
        <input
          required
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted">Line items</label>
        <div className="space-y-2">
          {lineItems.map((row, i) => (
            <div key={i} className="space-y-1">
              <div className="flex gap-2">
                <input
                  placeholder="Description"
                  value={row.description}
                  onChange={(e) => updateLineItem(i, "description", e.target.value)}
                  className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <input
                  placeholder="Amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.amount}
                  onChange={(e) => updateLineItem(i, "amount", e.target.value)}
                  className={`w-32 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent ${noSpinnerClass}`}
                />
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLineItem(i)}
                    className="text-xs text-muted hover:text-warm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) updateLineItem(i, "description", e.target.value);
                }}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted outline-none focus:border-accent"
              >
                <option value="">Insert a preset description…</option>
                {LINE_ITEM_PRESETS.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          ))}
        </div>
        <button type="button" onClick={addLineItem} className="mt-2 text-xs text-accent hover:underline">
          + Add line item
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">
          Deposit amount <span className="text-muted/70">(optional — leave blank for full payment)</span>
        </label>
        <input
          placeholder="e.g. 200"
          type="number"
          min="0"
          step="0.01"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          className={`w-40 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent ${noSpinnerClass}`}
        />
      </div>

      <p className="text-sm text-muted">
        Total: <span className="font-medium text-foreground">${total.toFixed(2)}</span>
        {depositAmount.trim() && !isNaN(parseFloat(depositAmount)) && (
          <>
            {" "}
            · Deposit due now:{" "}
            <span className="font-medium text-foreground">${parseFloat(depositAmount).toFixed(2)}</span> · Balance
            later: <span className="font-medium text-foreground">${(total - parseFloat(depositAmount)).toFixed(2)}</span>
          </>
        )}
      </p>

      {error && <p className="text-sm text-warm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Create draft invoice"}
      </button>
    </form>
  );
}
