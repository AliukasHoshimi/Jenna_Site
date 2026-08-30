export const metadata = {
  title: "Privacy Policy — Studio (Samsarafilmss)",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-12">
      <p className="mb-1 font-display text-lg tracking-wide text-foreground">SAMSARAFILMSS</p>
      <h1 className="mb-6 font-display text-2xl text-foreground">Privacy Policy</h1>

      <div className="space-y-5 text-sm leading-relaxed text-foreground/90">
        <p>
          This is a private administrative tool used internally by Samsarafilmss to manage client
          communication, scheduling, invoicing, and contracts. It is not a public-facing product and is
          not intended for use by the general public.
        </p>

        <section>
          <h2 className="mb-1 font-medium text-foreground">Google Calendar access</h2>
          <p>
            When an admin connects Google Calendar, this tool requests permission to create, edit, and
            delete events on the connected calendar, and to read the basic account email of the connected
            Google account so we can display which account is linked. This access is used solely to
            schedule client shoots from this tool and keep them synced with that Google Calendar. No other
            calendars, files, or Google data are accessed.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-medium text-foreground">Data storage</h2>
          <p>
            The OAuth refresh token issued by Google is stored securely on our server and used only to
            make Calendar API requests on behalf of the connected account. It is never shared with any
            third party.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-medium text-foreground">Revoking access</h2>
          <p>
            Access can be disconnected at any time from the Calendar page in the admin tool, or by
            revoking it directly at{" "}
            <a
              href="https://myaccount.google.com/permissions"
              className="text-accent hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              myaccount.google.com/permissions
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-medium text-foreground">Other data</h2>
          <p>
            Client contact information, invoices, and contracts are stored to run this photography
            business and are not sold or shared with third parties beyond the service providers necessary
            to operate it (email delivery and payment processing).
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-medium text-foreground">Contact</h2>
          <p>
            Questions about this policy: <span className="text-foreground">aliukashoshimi@gmail.com</span>
          </p>
        </section>
      </div>
    </main>
  );
}
