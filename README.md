# Studio — Samsarafilmss

Private admin tool for Jenna's photography business: client inbox, reply
templates, and invoicing. Lives at `studio.samsarafilmss.com`, separate from
the public marketing site. Full context and design decisions are in the
build brief this project was scaffolded from.

**Status:** live at `studio.samsarafilmss.com` on Vercel (not Firebase App
Hosting — see Deploying below). Firebase (Firestore + Auth), Mailgun (send +
inbound routing, real DNS verified), and Stripe (test mode: secret key +
webhook endpoint, both configured) are all real and wired up. Contracts
with e-signature, client intake questionnaires, deposit/balance invoicing,
a Google Calendar integration, and client self-booking have all shipped
since the original scaffold. Still on Stripe test-mode keys — switch to
live keys (and add a **new, separate live-mode webhook** — Stripe doesn't
carry test-mode webhooks over) only once the payment flow's been verified
end to end.

## Stack

Next.js (App Router) on Vercel, Firestore, Firebase Auth, Mailgun (send +
inbound routing), Stripe Checkout, Google Calendar API,
`@react-pdf/renderer`.

## Prerequisites

1. ~~Create a Firebase project with Firestore and Authentication~~ — **done.**
   Project `samsarafilmss-studio`, Firestore provisioned and rules deployed,
   Jenna's login user exists.
2. **Create a Mailgun account**, add a sending/receiving domain (e.g.
   `mail.samsarafilmss.com`), and verify the DNS records (MX, TXT/SPF,
   DKIM) — this requires DNS access to `samsarafilmss.com`. Inbound routing
   can't be tested until these DNS records are live.
3. **Create a Stripe account.** Test-mode keys are enough to build and
   verify against; switch to live keys only once the whole flow works.
4. **DNS access to `samsarafilmss.com`**, to point `studio.samsarafilmss.com`
   at the Vercel deployment and to add Mailgun's records.
5. **A Google Cloud OAuth client** (separate from the Firebase Auth login
   client) with the Calendar API enabled, for the Calendar integration —
   see `.env.local.example` for the exact scopes/setup notes.

Don't wire real integration code against placeholder values and call it
done — until these exist, treat every integration point below as untested.

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in real values as they become available
npm run dev
```

Without real Firebase config, `/login` renders but sign-in will fail (there's
no Firebase project to authenticate against yet). Everything under `/admin`
requires a valid session, so it's not meaningfully testable until Firebase
Auth is set up.

Other useful scripts: `npm run build`, `npm run typecheck`, `npm run lint`.

## Environment variables

See `.env.local.example` for the full list with descriptions. In production
these are set in the Vercel project's dashboard (Settings → Environment
Variables), not committed anywhere — see Deploying below.

## Data model

Firestore collections: `contacts`, `threads` (with a `messages` subcollection
per thread), `templates`, `invoices`, `contracts`, `questionnaires`,
`calendarEvents` (a thin mirror of real Google Calendar events),
`bookingRequests` (client self-booking requests), plus singleton docs
`settings/googleCalendar` and `settings/booking`. See
`src/types/firestore.ts` for the exact shape. Firestore security rules
(`firestore.rules`) deny all direct client-side access — every read/write
goes through this app's server code (API routes and server components)
using the Firebase Admin SDK.

## Calendar & self-booking

Jenna connects her Google Calendar once (`/admin/calendar`, OAuth via a
dedicated client — see Prerequisites). Once connected:

- Events can be created manually (Calendar page, or the "Schedule" popup
  on a thread) — these both create a real Google Calendar event and a
  `calendarEvents` mirror doc.
- **Self-booking**: clicking "Send booking link" on a thread generates a
  stable per-thread link (`/book/[token]`) that Jenna sends manually in a
  reply. A client picks a session type and an open slot there; submitting
  immediately creates a `pending` `bookingRequests` doc that holds the slot
  (a Firestore transaction prevents two overlapping submissions), but
  nothing lands on the real calendar until Jenna approves it from the
  Calendar page's pending-requests panel. Availability is computed against
  Jenna's **real** Google Calendar via `freebusy.query`
  (`src/lib/booking-availability.ts`), not just events created through this
  app — blocking time directly on her real calendar (a vacation, a
  personal appointment) closes those slots automatically, no separate
  "blackout" feature needed.
- Working hours, buffer time, minimum notice, booking window, and the
  selectable session types (name/duration/description) are configurable at
  `/admin/calendar/settings`, with hardcoded fallback defaults
  (`DEFAULT_BOOKING_SETTINGS` in `src/lib/booking-availability.ts`) so the
  feature works before that page is ever visited. **Confirm the timezone
  there is actually correct** — it drives every slot time shown to real
  clients.

`scripts/seed.mjs` writes a small set of fake contacts/threads/templates/
invoices for Phase 2 UI verification (`node scripts/seed.mjs`, reads
`FIREBASE_SERVICE_ACCOUNT_KEY` from `.env.local`). It also sets the
`counters/invoices` doc so real invoices created afterward continue
numbering from where the seed data left off. Safe to rerun against a test
project; don't run it against a project with real client data in it.

## Design tokens (placeholder)

The color palette and font pairing (`src/lib/design-tokens.ts` and
`src/app/globals.css`) are placeholders — a neutral warm/sage palette with
Fraunces + Inter — not the marketing site's actual brand. Swap both files
together once the marketing site's real tokens are available; the invoice
PDF (`src/lib/pdf/invoice-pdf.tsx`) reads the same constants so it stays in
sync automatically.

## Assumptions made without explicit confirmation

- **Invoice numbering**: sequential starting at #1001 (`src/lib/invoice-number.ts`).
  Confirm this is what Jenna actually wants — the brief left it open.
- **New-message notification**: if `NOTIFY_EMAIL` is set, Jenna gets a short
  email when a new inbound message arrives. Leave it unset to skip this.
- **PDF fonts**: uses react-pdf's built-in Helvetica rather than custom
  fonts, to avoid fetching font files at render time in Cloud Run. Swap in
  real brand fonts once font files are available to bundle locally.

## Marketing site → this app

The marketing site's contact form should POST server-to-server to
`/api/public/intake` with a JSON body `{ name, email, phone?, instagram?,
message, source?, budget? }` and header `x-intake-secret:
<INTAKE_API_SECRET>`. This creates/reuses a contact and opens a new thread
with the message as the first inbound message. The secret must live in the
marketing site's own backend/serverless function — never in its client-side
JS.

`budget` is optional free text (a number, a range, or "not sure") from the
form's estimated-budget field — stored per-thread as `estimatedBudget`
(not on the contact, since the same person inquiring again later could
have a different budget in mind), shown on the thread list and the thread
detail page. Capped at 200 characters server-side.

## Deploying (Vercel)

Despite the `apphosting.yaml`/`.firebaserc` left over from the original
scaffold, this app actually deploys on **Vercel**, connected to the GitHub
repo for auto-deploy on push to `main`. Firebase is used only for
Firestore + Auth, not hosting.

1. In the Vercel project's dashboard, set every variable from
   `.env.local.example` under Settings → Environment Variables (Production,
   and Preview if you want preview deploys to work too).
2. `firebase login`, then `firebase deploy --only firestore:rules` and
   `firebase deploy --only firestore:indexes` to publish `firestore.rules`
   and `firestore.indexes.json` against the real project.
3. Point `studio.samsarafilmss.com` at the Vercel project (custom domain
   setup in the Vercel dashboard).
4. In Mailgun, route inbound mail for `reply+*@mail.samsarafilmss.com` (and
   optionally a catch-all address) to
   `https://studio.samsarafilmss.com/api/webhooks/mailgun-inbound`.
5. In Stripe, add a webhook endpoint for
   `https://studio.samsarafilmss.com/api/webhooks/stripe` listening for
   `checkout.session.completed`, and put its signing secret in
   `STRIPE_WEBHOOK_SECRET`. **Test mode and live mode webhooks are
   separate** — switching to live Stripe keys means creating a new webhook
   endpoint under live mode too, not just swapping the secret key.
6. In Google Cloud Console, add both `http://localhost:3000/api/google-calendar/callback`
   (for local dev) and `https://studio.samsarafilmss.com/api/google-calendar/callback`
   as authorized redirect URIs on the Calendar OAuth client.
7. Vercel Cron (`vercel.json`) runs the overdue-invoice-reminder and
   booking-request-expiry jobs — no extra setup needed beyond `CRON_SECRET`
   being set, but note Vercel's Hobby plan limits cron jobs to once/day.

## Testing notes

- **Stripe**: use test-mode keys and Stripe's test card numbers first. Use
  `stripe listen --forward-to localhost:3000/api/webhooks/stripe` to test
  the webhook locally without deploying.
- **Mailgun**: sending can be tested against a sandbox domain before the
  real domain is verified; inbound routing needs the real domain's MX
  records live, so it can't be tested until DNS is set up.
- Don't test against real client email addresses or process real payments
  until the full flow has been verified with test data.

## What this app deliberately doesn't do

No client photo galleries/downloads/prints — those stay on Pixieset. No
client-facing portal beyond the one-off emailed links (pay invoice, sign
contract, fill questionnaire, book a session) — there's no single page
showing a client everything tied to their booking at once.
