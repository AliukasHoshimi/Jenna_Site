"use client";

import { useEffect, useMemo, useState } from "react";
import { DateCalendarDropdown } from "./date-calendar-dropdown";

interface Slot {
  start: string;
  end: string;
}

interface SessionType {
  id: string;
  name: string;
  durationMinutes: number;
  description: string | null;
}

export function BookingPicker({ token }: { token: string }) {
  const [sessionTypes, setSessionTypes] = useState<SessionType[] | null>(null);
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<SessionType | null>(null);

  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/book/${token}/session-types`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setTypesError(data.error);
          return;
        }
        setSessionTypes(data.sessionTypes);
        setBookingEnabled(data.bookingEnabled);
      })
      .catch(() => setTypesError("Could not load booking options."));
  }, [token]);

  function loadAvailability(sessionTypeId: string) {
    setSlots(null);
    fetch(`/api/book/${token}/availability?sessionTypeId=${sessionTypeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setSlots(data.slots);
      })
      .catch(() => setError("Could not load availability."));
  }

  function handleSelectType(type: SessionType) {
    setSelectedType(type);
    setSelectedDay(null);
    setSelectedSlot(null);
    setError(null);
    loadAvailability(type.id);
  }

  // Grouped by the viewer's own browser-local calendar date — the API
  // returns real UTC instants, and letting the browser apply its own local
  // zone (same idea as LocalDateTime elsewhere in this app) is the
  // friendliest way to show a client, wherever they are, what time it'd
  // actually be for them.
  const days = useMemo(() => {
    if (!slots) return [];
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const key = new Date(s.start).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).map(([key, daySlots]) => ({
      key,
      date: new Date(daySlots[0].start),
      slots: daySlots,
    }));
  }, [slots]);

  useEffect(() => {
    if (!selectedDay && days.length > 0) setSelectedDay(days[0].key);
  }, [days, selectedDay]);

  async function handleSubmit() {
    if (!selectedSlot || !selectedType) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/book/${token}/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: selectedSlot.start,
        end: selectedSlot.end,
        sessionTypeId: selectedType.id,
        note: note.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
      return;
    }
    setError(data.error ?? "Could not submit your request.");
    if (res.status === 409) {
      setSelectedSlot(null);
      loadAvailability(selectedType.id);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm">
        <p className="font-medium text-foreground">Request sent!</p>
        <p className="mt-1 text-muted">Jenna will confirm shortly — you&apos;ll get an email either way.</p>
      </div>
    );
  }

  if (typesError) {
    return <p className="text-sm text-warm">{typesError}</p>;
  }

  if (sessionTypes === null) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (!bookingEnabled) {
    return <p className="text-sm text-muted">Jenna isn&apos;t currently accepting new booking requests — please reply to the email instead.</p>;
  }

  if (!selectedType) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">What kind of session would you like to book?</p>
        {sessionTypes.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleSelectType(t)}
            className="block w-full rounded-lg border border-border bg-surface p-4 text-left hover:border-accent"
          >
            <p className="text-sm font-medium text-foreground">
              {t.name} <span className="font-normal text-muted">· {t.durationMinutes} min</span>
            </p>
            {t.description && <p className="mt-1 text-xs text-muted">{t.description}</p>}
          </button>
        ))}
      </div>
    );
  }

  const activeDay = days.find((d) => d.key === selectedDay);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => {
          setSelectedType(null);
          setSlots(null);
        }}
        className="text-xs text-accent hover:underline"
      >
        ← Change visit type
      </button>

      {error && <p className="text-sm text-warm">{error}</p>}

      {slots === null ? (
        <p className="text-sm text-muted">Loading availability…</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-muted">No open times right now — please reply to the email to find a time.</p>
      ) : (
        <>
          <DateCalendarDropdown
            days={days}
            selectedDay={selectedDay}
            onSelect={(key) => {
              setSelectedDay(key);
              setSelectedSlot(null);
            }}
          />

          {activeDay && (
            <div className="flex flex-wrap gap-2">
              {activeDay.slots.map((s) => (
                <button
                  key={s.start}
                  type="button"
                  onClick={() => setSelectedSlot(s)}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    selectedSlot?.start === s.start
                      ? "border-accent bg-accent text-accent-contrast"
                      : "border-border bg-surface text-foreground hover:border-accent"
                  }`}
                >
                  {new Date(s.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {selectedSlot && (
        <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <div>
            <label className="mb-1 block text-sm text-muted">Anything Jenna should know? (optional)</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-warm px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-accent-contrast disabled:opacity-60"
          >
            {submitting ? "Requesting…" : "Request this time"}
          </button>
        </div>
      )}
    </div>
  );
}
