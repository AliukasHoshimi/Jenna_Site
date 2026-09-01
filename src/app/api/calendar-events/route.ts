import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { contactsCol } from "@/lib/firestore-collections";
import { insertGoogleCalendarEvent, createCalendarEventMirror } from "@/lib/google-calendar";

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
    const { googleEventId, htmlLink } = await insertGoogleCalendarEvent({
      title,
      description: description ?? null,
      start,
      end,
      attendeeEmail,
    });
    const id = await createCalendarEventMirror({
      googleEventId,
      htmlLink,
      title,
      description: description ?? null,
      start,
      end,
      contactId: contactId ?? null,
      threadId: threadId ?? null,
    });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create event" },
      { status: 502 }
    );
  }
}
