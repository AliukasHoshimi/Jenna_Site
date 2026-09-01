"use client";

import { useEffect, useState } from "react";

interface Booking {
  id: string;
  sessionTypeName: string;
  status: "pending" | "approved";
  start: string;
  end: string;
}

export function MyBookingsPanel({ token, onReschedule }: { token: string; onReschedule: () => void }) {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch(`/api/book/${token}/my-bookings`)
      .then((res) => res.json())
      .then((data) => setBookings(data.bookings ?? []))
      .catch(() => setBookings([]));
  }

  useEffect(load, [token]);

  async function handleCancel(id: string, andReschedule: boolean) {
    if (!andReschedule && !confirm("Cancel this booking?")) return;
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/book/${token}/bookings/${id}/cancel`, { method: "POST" });
    setBusyId(null);
    if (res.ok) {
      load();
      if (andReschedule) onReschedule();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not cancel this booking.");
    }
  }

  if (!bookings || bookings.length === 0) return null;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Your bookings</h2>
      {error && <p className="text-sm text-warm">{error}</p>}
      <div className="divide-y divide-border">
        {bookings.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm font-medium text-foreground">{b.sessionTypeName}</p>
              <p className="text-xs text-muted">
                {new Date(b.start).toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {" · "}
                <span className={b.status === "approved" ? "text-success" : "text-warm"}>
                  {b.status === "approved" ? "Confirmed" : "Pending approval"}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => handleCancel(b.id, true)}
                disabled={busyId === b.id}
                className="text-xs text-accent hover:underline disabled:opacity-60"
              >
                Reschedule
              </button>
              <button
                type="button"
                onClick={() => handleCancel(b.id, false)}
                disabled={busyId === b.id}
                className="text-xs text-warm hover:underline disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
