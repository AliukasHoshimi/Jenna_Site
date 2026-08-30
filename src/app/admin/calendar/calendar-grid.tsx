"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface EventItem {
  id: string;
  title: string;
  contactId: string | null;
  start: string;
  end: string;
}

export function CalendarGrid({
  events,
  contactsById,
}: {
  events: EventItem[];
  contactsById: Record<string, { name: string }>;
}) {
  const [mounted, setMounted] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  // Bucketing events into day cells depends on the viewer's local timezone —
  // the server renders in UTC, so this has to happen after mount rather than
  // during SSR (same reason LocalDateTime exists for plain timestamps).
  useEffect(() => {
    setViewDate(new Date());
    setMounted(true);
  }, []);

  const year = viewDate.getFullYear();
  const monthIndex = viewDate.getMonth();
  const today = new Date();

  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const eventsByDay = useMemo(() => {
    const map = new Map<number, EventItem[]>();
    for (const event of events) {
      const d = new Date(event.start);
      if (d.getFullYear() === year && d.getMonth() === monthIndex) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(event);
      }
    }
    for (const list of map.values()) list.sort((a, b) => a.start.localeCompare(b.start));
    return map;
  }, [events, year, monthIndex]);

  if (!mounted) {
    return (
      <div className="rounded-lg border border-border bg-surface p-10 text-center text-sm text-muted">
        Loading calendar…
      </div>
    );
  }

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  function goToMonth(delta: number) {
    setViewDate(new Date(year, monthIndex + delta, 1));
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            aria-label="Previous month"
            className="rounded-md border border-border px-2 py-1 text-sm text-muted hover:border-accent hover:text-foreground"
          >
            ‹
          </button>
          <h2 className="w-44 text-center font-display text-lg text-foreground">{monthLabel}</h2>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            aria-label="Next month"
            className="rounded-md border border-border px-2 py-1 text-sm text-muted hover:border-accent hover:text-foreground"
          >
            ›
          </button>
        </div>
        <button type="button" onClick={() => setViewDate(new Date())} className="text-xs text-accent hover:underline">
          Today
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-surface">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-medium text-muted">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }).map((_, i) => {
            const dayNum = i - firstWeekday + 1;
            const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
            const isToday =
              inMonth &&
              today.getFullYear() === year &&
              today.getMonth() === monthIndex &&
              today.getDate() === dayNum;
            const dayEvents = inMonth ? (eventsByDay.get(dayNum) ?? []) : [];
            return (
              <div
                key={i}
                className={`min-h-[6.5rem] border-b border-r border-border p-1.5 [&:nth-child(7n)]:border-r-0 ${
                  inMonth ? "bg-background" : "bg-surface/40"
                }`}
              >
                {inMonth && (
                  <>
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                        isToday ? "bg-accent text-accent-contrast" : "text-muted"
                      }`}
                    >
                      {dayNum}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 3).map((event) => {
                        const contact = event.contactId ? contactsById[event.contactId] : null;
                        const time = new Date(event.start).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        });
                        return (
                          <Link
                            key={event.id}
                            href={`/admin/calendar/${event.id}`}
                            title={`${event.title}${contact ? ` · ${contact.name}` : ""}`}
                            className="block truncate rounded bg-accent/10 px-1 py-0.5 text-[11px] text-accent hover:bg-accent/20"
                          >
                            {time} {event.title}
                          </Link>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <p className="px-1 text-[11px] text-muted">+{dayEvents.length - 3} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
