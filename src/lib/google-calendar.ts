import "server-only";
import { google } from "googleapis";
import { googleCalendarSettingsDoc } from "@/lib/firestore-collections";

// Events-only scope — enough to create/edit/delete events on her calendars
// without also granting calendar management (creating/deleting calendars
// themselves).
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

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
