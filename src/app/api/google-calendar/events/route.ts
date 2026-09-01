import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getCalendarClient } from "@/lib/google-calendar";

// Admin-only — returns Jenna's real Google Calendar events for one month,
// including ones never created through this app (personal appointments,
// other clients booked outside Studio). Read-only, no scope beyond the
// already-granted calendar.events (the same scope that lets the app create
// events already covers listing them). Distinct from calendarEventsCol,
// which only mirrors events this app itself created.
export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { searchParams } = request.nextUrl;
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month")); // 0-indexed, matching JS Date
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
    return NextResponse.json({ error: "Valid year and month (0-11) are required" }, { status: 400 });
  }

  // A little slack on either side so events spanning the month boundary
  // (or shown due to the viewer's timezone) aren't cut off.
  const timeMin = new Date(year, month - 1, 25).toISOString();
  const timeMax = new Date(year, month + 2, 5).toISOString();

  try {
    const calendar = await getCalendarClient();
    const { data } = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    const events = (data.items ?? [])
      .filter((e) => e.status !== "cancelled" && (e.start?.dateTime || e.start?.date))
      .map((e) => ({
        id: e.id!,
        title: e.summary || "(No title)",
        start: e.start!.dateTime ?? e.start!.date!,
        end: e.end?.dateTime ?? e.end?.date ?? e.start!.dateTime ?? e.start!.date!,
        htmlLink: e.htmlLink ?? null,
      }));

    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load Google Calendar events" },
      { status: 502 }
    );
  }
}
