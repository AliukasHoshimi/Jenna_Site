"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingSessionType, BookingSettings } from "@/types/firestore";

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

interface DayHours {
  enabled: boolean;
  start: string;
  end: string;
}

function toDayHours(workingHours: BookingSettings["workingHours"]): DayHours[] {
  return Array.from({ length: 7 }, (_, day) => {
    const hours = workingHours[day];
    return hours ? { enabled: true, start: hours.start, end: hours.end } : { enabled: false, start: "10:00", end: "17:00" };
  });
}

export function BookingSettingsForm({ initialSettings }: { initialSettings: BookingSettings }) {
  const router = useRouter();
  const [timezone, setTimezone] = useState(initialSettings.timezone);
  const [bookingEnabled, setBookingEnabled] = useState(initialSettings.bookingEnabled);
  const [bufferMinutes, setBufferMinutes] = useState(initialSettings.bufferMinutes);
  const [minNoticeHours, setMinNoticeHours] = useState(initialSettings.minNoticeHours);
  const [bookingWindowDays, setBookingWindowDays] = useState(initialSettings.bookingWindowDays);
  const [requestExpiryHours, setRequestExpiryHours] = useState(initialSettings.requestExpiryHours);
  const [days, setDays] = useState<DayHours[]>(toDayHours(initialSettings.workingHours));
  const [sessionTypes, setSessionTypes] = useState<BookingSessionType[]>(initialSettings.sessionTypes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function updateDay(index: number, patch: Partial<DayHours>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function updateSessionType(index: number, patch: Partial<BookingSessionType>) {
    setSessionTypes((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function addSessionType() {
    setSessionTypes((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "New session type", durationMinutes: 60, description: null },
    ]);
  }

  function removeSessionType(index: number) {
    setSessionTypes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const workingHours: BookingSettings["workingHours"] = {};
    days.forEach((d, i) => {
      if (d.enabled) workingHours[i] = { start: d.start, end: d.end };
    });

    const res = await fetch("/api/booking-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timezone,
        bookingEnabled,
        bufferMinutes,
        minNoticeHours,
        bookingWindowDays,
        requestExpiryHours,
        workingHours,
        sessionTypes,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setError(data.error ?? "Could not save settings.");
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">General</h2>
        <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={bookingEnabled} onChange={(e) => setBookingEnabled(e.target.checked)} />
            Currently accepting new booking requests
          </label>

          <div>
            <label className="mb-1 block text-sm text-muted">Timezone (working hours are anchored to this)</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            >
              {!COMMON_TIMEZONES.includes(timezone) && <option value={timezone}>{timezone}</option>}
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-muted">Buffer between bookings (minutes)</label>
              <input
                type="number"
                min={0}
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Minimum notice (hours)</label>
              <input
                type="number"
                min={0}
                value={minNoticeHours}
                onChange={(e) => setMinNoticeHours(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Booking window (days ahead)</label>
              <input
                type="number"
                min={0}
                value={bookingWindowDays}
                onChange={(e) => setBookingWindowDays(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Request expiry (hours)</label>
              <input
                type="number"
                min={0}
                value={requestExpiryHours}
                onChange={(e) => setRequestExpiryHours(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">Working hours</h2>
        <div className="divide-y divide-border rounded-lg border border-border bg-surface">
          {days.map((d, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <label className="flex w-32 shrink-0 items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={d.enabled} onChange={(e) => updateDay(i, { enabled: e.target.checked })} />
                {WEEKDAY_LABELS[i]}
              </label>
              <input
                type="time"
                value={d.start}
                disabled={!d.enabled}
                onChange={(e) => updateDay(i, { start: e.target.value })}
                className="rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-accent disabled:opacity-40"
              />
              <span className="text-sm text-muted">to</span>
              <input
                type="time"
                value={d.end}
                disabled={!d.enabled}
                onChange={(e) => updateDay(i, { end: e.target.value })}
                className="rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-accent disabled:opacity-40"
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">Session types</h2>
        <div className="space-y-3">
          {sessionTypes.map((t, i) => (
            <div key={t.id} className="space-y-2 rounded-lg border border-border bg-surface p-4">
              <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted">Name</label>
                    <input
                      value={t.name}
                      onChange={(e) => updateSessionType(i, { name: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted">Duration (minutes)</label>
                    <input
                      type="number"
                      min={1}
                      value={t.durationMinutes}
                      onChange={(e) => updateSessionType(i, { durationMinutes: Number(e.target.value) })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSessionType(i)}
                  disabled={sessionTypes.length <= 1}
                  className="mt-5 text-xs text-warm hover:opacity-80 disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">
                  Description shown to clients <span className="text-muted/70">(optional)</span>
                </label>
                <input
                  value={t.description ?? ""}
                  onChange={(e) => updateSessionType(i, { description: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
            </div>
          ))}
          <button type="button" onClick={addSessionType} className="text-sm text-accent hover:underline">
            + Add session type
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-warm">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
        {saved && <span className="text-sm text-success">Saved.</span>}
      </div>
    </div>
  );
}
