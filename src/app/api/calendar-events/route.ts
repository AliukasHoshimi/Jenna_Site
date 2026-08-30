import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { calendarEventsCol, contactsCol } from "@/lib/firestore-collections";
import { getCalendarClient } from "@/lib/google-calendar";

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const payload = await request.json().catch(() => null);
  const { title, description, start, end, contactId, threadId } = (payload ?? {}) as {
    title?: string;
    description?: string | null;
    start?: string;
    end?: string;
    contactId?: string | null;
    threadId?: string | null;
  };
  if (!title || !start || !end) {
    return NextResponse.json({ error: "title, start, and end are required" }, { status: 400 });
  }
  if (new Date(end) <= new Date(start)) {
    return NextResponse.json({ error: "end must be after start" }, { status: 400 });
  }

  let attendeeEmail: string | null = null;
  if (contactId) {
    const contactSnap = await contactsCol().doc(contactId).get();
    attendeeEmail = contactSnap.data()?.email ?? null;
  }

  try {
    const calendar = await getCalendarClient();
    const { data: googleEvent } = await calendar.events.insert({
      calendarId: "primary",
      sendUpdates: attendeeEmail ? "all" : "none",
      requestBody: {
        summary: title,
        description: description || undefined,
        start: { dateTime: start },
        end: { dateTime: end },
        attendees: attendeeEmail ? [{ email: attendeeEmail }] : undefined,
      },
    });

    const docRef = await calendarEventsCol().add({
      googleEventId: googleEvent.id!,
      contactId: contactId ?? null,
      threadId: threadId ?? null,
      title,
      description: description ?? null,
      start: Timestamp.fromDate(new Date(start)),
      end: Timestamp.fromDate(new Date(end)),
      htmlLink: googleEvent.htmlLink ?? "",
      createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
    });

    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create event" },
      { status: 502 }
    );
  }
}
