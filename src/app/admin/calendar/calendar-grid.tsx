"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PendingRequestModal } from "./pending-request-modal";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface EventItem {
  id: string;
  googleEventId: string;
  title: string;
  contactId: string | null;
  start: string;
  end: string;
}

interface PendingItem {
  id: string;
  sessionTypeName: string;
  contactId: string | null;
  contactName: string;
  threadId: string;
  start: string;
  end: string;
  clientNote: string | null;
}

interface ExternalEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  htmlLink: string | null;
}

// She already tags shoot/work events with a camera emoji in the title on
// her real Google Calendar (e.g. "Madison & Josh Elopement!📸") — reusing
// that existing signal to color-code external events needs no new habit
// from her, unlike Google's own per-event colors, which she doesn't use.
const WORK_EVENT_PATTERN = /[\u{1F4F8}\u{1F4F7}]/u;

type GridItem =
  | { kind: "confirmed"; key: string; title: string; contactId: string | null; start: string; href: string }
  | { kind: "pending"; key: string; title: string; contactId: string | null; start: string; pending: PendingItem }
  | { kind: "external"; key: string; title: string; contactId: null; start: string; htmlLink: string | null; isWork: boolean };

export function CalendarGrid({
  events,
  pendingRequests,
  contactsById,
}: {
  events: EventItem[];
  pendingRequests: PendingItem[];
  contactsById: Record<string, { name: string }>;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedPending, setSelectedPending] = useState<PendingItem | null>(null);
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);

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

  // Her real Google Calendar for the visible month, refetched on month
  // navigation — includes personal events and anything booked outside this
  // app, not just what calendarEventsCol mirrors.
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    fetch(`/api/google-calendar/events?year=${year}&month=${monthIndex}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.events)) setExternalEvents(data.events);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mounted, year, monthIndex]);

  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const knownGoogleEventIds = useMemo(() => new Set(events.map((e) => e.googleEventId)), [events]);

  const allItems: GridItem[] = useMemo(
    () => [
      ...events.map((e): GridItem => ({
        kind: "confirmed",
        key: `event-${e.id}`,
        title: e.title,
        contactId: e.contactId,
        start: e.start,
        href: `/admin/calendar/${e.id}`,
      })),
      ...pendingRequests.map((r): GridItem => ({
        kind: "pending",
        key: `pending-${r.id}`,
        title: r.sessionTypeName,
        contactId: r.contactId,
        start: r.start,
        pending: r,
      })),
      // Already-mirrored events would otherwise show twice — once as
      // "confirmed" (from calendarEventsCol) and once here, since her real
      // calendar includes those same events.
      ...externalEvents
        .filter((e) => !knownGoogleEventIds.has(e.id))
        .map((e): GridItem => ({
          kind: "external",
          key: `external-${e.id}`,
          title: e.title,
          contactId: null,
          start: e.start,
          htmlLink: e.htmlLink,
          isWork: WORK_EVENT_PATTERN.test(e.title),
        })),
    ],
    [events, pendingRequests, externalEvents, knownGoogleEventIds]
  );

  const itemsByDay = useMemo(() => {
    const map = new Map<number, GridItem[]>();
    for (const item of allItems) {
      const d = new Date(item.start);
      if (d.getFullYear() === year && d.getMonth() === monthIndex) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(item);
      }
    }
    for (const list of map.values()) list.sort((a, b) => a.start.localeCompare(b.start));
    return map;
  }, [allItems, year, monthIndex]);

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

  function pillClassName(kind: GridItem["kind"], isWork?: boolean) {
    if (kind === "pending") {
      return "block truncate rounded border border-dashed border-warm bg-warm/10 px-1 py-0.5 text-[11px] text-warm hover:bg-warm/20";
    }
    if (kind === "external") {
      return isWork
        ? "block truncate rounded border border-dashed border-success/40 bg-success/10 px-1 py-0.5 text-[11px] text-success hover:bg-success/20"
        : "block truncate rounded border border-dashed border-muted/40 bg-muted/10 px-1 py-0.5 text-[11px] text-muted hover:bg-muted/20";
    }
    return "block truncate rounded bg-accent/10 px-1 py-0.5 text-[11px] text-accent hover:bg-accent/20";
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
        <div className="flex items-center gap-4">
          {pendingRequests.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-warm">
              <span className="h-2 w-2 rounded-full border border-warm" />
              {pendingRequests.length} pending
            </span>
          )}
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full border border-dashed border-success" />
              Work (📸)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full border border-dashed border-muted" />
              Personal
            </span>
          </div>
          <button type="button" onClick={() => setViewDate(new Date())} className="text-xs text-accent hover:underline">
            Today
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <div className="grid grid-cols-7 rounded-t-lg border-b border-border bg-surface">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-medium text-muted">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 [&>*:nth-last-child(-n+7)]:border-b-0">
          {Array.from({ length: totalCells }).map((_, i) => {
            const dayNum = i - firstWeekday + 1;
            const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
            const isToday =
              inMonth &&
              today.getFullYear() === year &&
              today.getMonth() === monthIndex &&
              today.getDate() === dayNum;
            const dayItems = inMonth ? (itemsByDay.get(dayNum) ?? []) : [];
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
                      {dayItems.slice(0, 3).map((item) => {
                        const contact = item.contactId ? contactsById[item.contactId] : null;
                        const time = new Date(item.start).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        });
                        const label = `${item.kind === "pending" ? "Pending: " : ""}${item.title}${contact ? ` · ${contact.name}` : ""}`;

                        if (item.kind === "pending") {
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setSelectedPending(item.pending)}
                              title={label}
                              className={`w-full text-left ${pillClassName(item.kind)}`}
                            >
                              {time} {item.title}
                            </button>
                          );
                        }
                        if (item.kind === "external") {
                          return item.htmlLink ? (
                            <a
                              key={item.key}
                              href={item.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              title={label}
                              className={pillClassName(item.kind, item.isWork)}
                            >
                              {time} {item.title}
                            </a>
                          ) : (
                            <span key={item.key} title={label} className={pillClassName(item.kind, item.isWork)}>
                              {time} {item.title}
                            </span>
                          );
                        }
                        return (
                          <Link key={item.key} href={item.href} title={label} className={pillClassName(item.kind)}>
                            {time} {item.title}
                          </Link>
                        );
                      })}
                      {dayItems.length > 3 && (
                        <p className="px-1 text-[11px] text-muted">+{dayItems.length - 3} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedPending && (
        <PendingRequestModal
          item={{
            id: selectedPending.id,
            sessionTypeName: selectedPending.sessionTypeName,
            contactName: selectedPending.contactName,
            threadId: selectedPending.threadId,
            startIso: selectedPending.start,
            endIso: selectedPending.end,
            clientNote: selectedPending.clientNote,
          }}
          onClose={() => setSelectedPending(null)}
          onDone={() => {
            setSelectedPending(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
