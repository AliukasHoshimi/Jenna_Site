import "server-only";
import { google } from "googleapis";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { googleCalendarSettingsDoc, calendarEventsCol } from "@/lib/firestore-collections";

// Events-only scope — enough to create/edit/delete events on her calendars
// without also granting calendar management (creating/deleting calendars
// themselves). userinfo.email is added so the post-consent userinfo lookup
// (to label which account got connected) is actually authorized — without
// it, that call 401s even though the token exchange itself succeeds.
// calendar.freebusy is the narrowest scope that grants freebusy.query
// (calendar.events does NOT cover it) — needed so the self-booking feature
// can check Jenna's real availability, including personal events never
// created through this app, without also granting read access to full
// event details (titles, descriptions, attendees) the way calendar.events
// or the broader calendar scope would.
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/userinfo.email",
];

function oauthClient(redirectUri: string) {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CALENDAR_CLIENT_ID / GOOGLE_CALENDAR_CLIENT_SECRET are not set.");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGoogleAuthUrl(redirectUri: string) {
  const client = oauthClient(redirectUri);
  return client.generateAuthUrl({
    // offline + consent: without both, Google only returns a refresh token
    // on the very first-ever authorization, which is useless if she ever
    // needs to reconnect.
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function exchangeCodeForConnection(code: string, redirectUri: string) {
  const client = oauthClient(redirectUri);
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error("Google didn't return a refresh token. Disconnect and reconnect to force a fresh consent.");
  }
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();
  return { refreshToken: tokens.refresh_token, email: data.email ?? "unknown" };
}

export async function isCalendarConnected() {
  const snap = await googleCalendarSettingsDoc().get();
  return snap.exists;
}

export async function getCalendarClient() {
  const snap = await googleCalendarSettingsDoc().get();
  const settings = snap.data();
  if (!settings) throw new Error("Google Calendar isn't connected.");
  // redirectUri is only meaningful during the authorization-code exchange;
  // refreshing an access token from a stored refresh token doesn't need it.
  const client = oauthClient("");
  client.setCredentials({ refresh_token: settings.refreshToken });
  return google.calendar({ version: "v3", auth: client });
}

/**
 * Busy intervals on the connected calendar within [rangeStart, rangeEnd],
 * straight from Google — this is the only source of truth the booking
 * availability engine uses for "is Jenna free," since it reflects personal
 * events and anything added directly in Google, not just events created
 * through this app.
 */
export async function getFreeBusy(rangeStart: Date, rangeEnd: Date): Promise<{ start: Date; end: Date }[]> {
  const calendar = await getCalendarClient();
  const { data } = await calendar.freebusy.query({
    requestBody: {
      timeMin: rangeStart.toISOString(),
      timeMax: rangeEnd.toISOString(),
      items: [{ id: "primary" }],
    },
  });
  const busy = data.calendars?.primary?.busy ?? [];
  return busy
    .filter((b): b is { start: string; end: string } => !!b.start && !!b.end)
    .map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
}

interface CalendarEventInput {
  title: string;
  description: string | null;
  start: string; // ISO
  end: string; // ISO
  attendeeEmail: string | null;
}

/**
 * Just the Google API call, deliberately kept separate from
 * createCalendarEventMirror below — the booking-request approve flow needs
 * to persist the returned googleEventId onto its own doc *before* creating
 * the mirror doc, so a crash between the two can never lead to a duplicate
 * Google Calendar event on retry. The plain manual-create route calls both
 * back-to-back with no such requirement.
 */
export async function insertGoogleCalendarEvent(input: CalendarEventInput) {
  const calendar = await getCalendarClient();
  const { data: googleEvent } = await calendar.events.insert({
    calendarId: "primary",
    sendUpdates: input.attendeeEmail ? "all" : "none",
    requestBody: {
      summary: input.title,
      description: input.description || undefined,
      start: { dateTime: input.start },
      end: { dateTime: input.end },
      attendees: input.attendeeEmail ? [{ email: input.attendeeEmail }] : undefined,
    },
  });
  return { googleEventId: googleEvent.id!, htmlLink: googleEvent.htmlLink ?? "" };
}

/** Firestore mirror doc for an already-created Google Calendar event. */
export async function createCalendarEventMirror(input: {
  googleEventId: string;
  htmlLink: string;
  title: string;
  description: string | null;
  start: string; // ISO
  end: string; // ISO
  contactId: string | null;
  threadId: string | null;
}) {
  const docRef = await calendarEventsCol().add({
    googleEventId: input.googleEventId,
    contactId: input.contactId,
    threadId: input.threadId,
    title: input.title,
    description: input.description,
    start: Timestamp.fromDate(new Date(input.start)),
    end: Timestamp.fromDate(new Date(input.end)),
    htmlLink: input.htmlLink,
    createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
  });
  return docRef.id;
}
