"use client";

// Server components run on Vercel in UTC, not Jenna's actual timezone —
// formatting a real instant (as opposed to a calendar-only date like a due
// date) has to happen client-side so it reflects whoever's actually
// looking at the page, in their own browser's local timezone.
export function LocalDateTime({ iso, dateOnly }: { iso: string; dateOnly?: boolean }) {
  const date = new Date(iso);
  const formatted = dateOnly
    ? date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : date.toLocaleString("en-US");
  return <>{formatted}</>;
}
