"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

interface DayOption {
  key: string; // Date.toDateString() of the day, in the viewer's local timezone
  date: Date;
}

export function DateCalendarDropdown({
  days,
  selectedDay,
  onSelect,
}: {
  days: DayOption[];
  selectedDay: string | null;
  onSelect: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => days[0]?.date ?? new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Jump the visible month to wherever availability actually starts
  // whenever the day list changes (e.g. after switching session type).
  useEffect(() => {
    if (days[0]) setViewDate(days[0].date);
  }, [days]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableByKey = useMemo(() => new Map(days.map((d) => [d.key, d])), [days]);
  const selected = selectedDay ? availableByKey.get(selectedDay) : undefined;

  const year = viewDate.getFullYear();
  const monthIndex = viewDate.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const today = new Date();
  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-foreground hover:border-accent"
      >
        <span>
          {selected
            ? selected.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
            : "Select a date"}
        </span>
        <span className="text-muted">▾</span>
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-72 rounded-lg border border-border bg-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, monthIndex - 1, 1))}
              aria-label="Previous month"
              className="rounded-md px-2 py-1 text-sm text-muted hover:text-foreground"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-foreground">{monthLabel}</span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, monthIndex + 1, 1))}
              aria-label="Next month"
              className="rounded-md px-2 py-1 text-sm text-muted hover:text-foreground"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted">
            {WEEKDAY_LABELS.map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum = i - firstWeekday + 1;
              const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
              if (!inMonth) return <div key={i} />;
              const cellDate = new Date(year, monthIndex, dayNum);
              const key = cellDate.toDateString();
              const available = availableByKey.has(key);
              const isToday = key === today.toDateString();
              const isSelected = key === selectedDay;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!available}
                  onClick={() => {
                    onSelect(key);
                    setOpen(false);
                  }}
                  className={`aspect-square rounded-md text-xs ${
                    isSelected
                      ? "bg-accent text-accent-contrast"
                      : available
                        ? "bg-accent/10 text-accent hover:bg-accent/20"
                        : "cursor-not-allowed text-muted/40"
                  } ${isToday && !isSelected ? "ring-1 ring-inset ring-accent/40" : ""}`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
