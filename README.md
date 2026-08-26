# Studio — Samsarafilmss

Private admin tool for Jenna's photography business: client inbox, reply
templates, and invoicing. Lives at `studio.samsarafilmss.com`, separate from
the public marketing site. Full context and design decisions are in the
build brief this project was scaffolded from.

**Status:** live at `studio.samsarafilmss.com` on Vercel (not Firebase App
Hosting — see note below). Firebase (Firestore + Auth), Mailgun (send +
inbound routing, real DNS verified), and Stripe (test mode: secret key +
webhook endpoint, both configured) are all real and wired up. Contracts
with e-signature, client intake questionnaires, and deposit/balance
invoicing have shipped since the original scaffold. Still on Stripe
test-mode keys — switch to live keys only once the payment flow's been
verified end to end.

## Stack

Next.js (App Router) on Firebase App Hosting, Firestore, Firebase Auth,
Mailgun (send + inbound routing), Stripe Checkout, `@react-pdf/renderer`.

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
   at this app's Firebase App Hosting deployment and to add Mailgun's
   records.

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
(Firebase App Hosting) these are set as secrets, not plain env vars — see
Deployment below.

## Data model

Firestore collections: `contacts`, `threads` (with a `messages` subcollection
per thread), `templates`, `invoices`. See `src/types/firestore.ts` for the
exact shape. Firestore security rules (`firestore.rules`) deny all direct
client-side access — every read/write goes through this app's server code
(API routes and server components) using the Firebase Admin SDK.

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
message, source? }` and header `x-intake-secret: <INTAKE_API_SECRET>`. This
creates/reuses a contact and opens a new thread with the message as the
first inbound message. The secret must live in the marketing site's own
backend/serverless function — never in its client-side JS.

## Deploying (Firebase App Hosting)

1. `firebase login`, then set the real project ID in `.firebaserc`.
2. Create each secret referenced in `apphosting.yaml`:
   ```bash
   firebase apphosting:secrets:set FIREBASE_SERVICE_ACCOUNT_KEY
   firebase apphosting:secrets:set STRIPE_SECRET_KEY
   # ...and so on for every variable in apphosting.yaml
   ```
3. `firebase deploy --only firestore:rules` to publish `firestore.rules`.
4. Set up the App Hosting backend (`firebase apphosting:backends:create`)
   and connect it to this repo, or deploy directly — see the [App Hosting
   docs](https://firebase.google.com/docs/app-hosting).
5. Point `studio.samsarafilmss.com` at the App Hosting backend (custom
   domain setup in the Firebase console).
6. In Mailgun, route inbound mail for `reply+*@mail.samsarafilmss.com` (and
   optionally a catch-all address) to
   `https://studio.samsarafilmss.com/api/webhooks/mailgun-inbound`.
7. In Stripe, add a webhook endpoint for
   `https://studio.samsarafilmss.com/api/webhooks/stripe` listening for
   `checkout.session.completed`, and put its signing secret in
   `STRIPE_WEBHOOK_SECRET`.

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

No scheduling/calendar booking, no client photo galleries/downloads/prints
— those stay on Pixieset.
