import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { calendarEventsCol } from "@/lib/firestore-collections";
import { getCalendarClient, deleteGoogleCalendarEvent } from "@/lib/google-calendar";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const eventRef = calendarEventsCol().doc(id);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  const event = eventSnap.data()!;

  const payload = await request.json().catch(() => null);
  const { title, description, start, end } = (payload ?? {}) as {
    title?: string;
    description?: string | null;
    start?: string;
    end?: string;
  };
  if (!title || !start || !end) {
    return NextResponse.json({ error: "title, start, and end are required" }, { status: 400 });
  }
  if (new Date(end) <= new Date(start)) {
    return NextResponse.json({ error: "end must be after start" }, { status: 400 });
  }

  try {
    const calendar = await getCalendarClient();
    await calendar.events.patch({
      calendarId: "primary",
      eventId: event.googleEventId,
      sendUpdates: event.contactId ? "all" : "none",
      requestBody: {
        summary: title,
        description: description || undefined,
        start: { dateTime: start },
        end: { dateTime: end },
      },
    });

    await eventRef.update({
      title,
      description: description ?? null,
      start: Timestamp.fromDate(new Date(start)),
      end: Timestamp.fromDate(new Date(end)),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update event" },
      { status: 502 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const eventRef = calendarEventsCol().doc(id);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  const event = eventSnap.data()!;

  try {
    // Already-gone (404/410) is swallowed inside deleteGoogleCalendarEvent,
    // so it falls through to the cleanup below instead of erroring here —
    // only a real failure lands in this catch.
    await deleteGoogleCalendarEvent(event.googleEventId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not delete event" },
      { status: 502 }
    );
  }

  await eventRef.delete();
  return NextResponse.json({ ok: true });
}
