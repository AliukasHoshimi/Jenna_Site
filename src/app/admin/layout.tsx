import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";
import { threadsCol, invoicesCol, contractsCol, questionnairesCol, bookingRequestsCol } from "@/lib/firestore-collections";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Every /admin route is protected here: no nested page renders until the
  // session cookie has been verified server-side against Firebase Auth.
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [openThreadsSnap, awaitingPaymentSnap, depositPaidSnap, awaitingSignatureSnap, awaitingResponseSnap, pendingBookingsSnap] =
    await Promise.all([
      threadsCol().where("status", "==", "open").get(),
      invoicesCol().where("status", "in", ["sent", "overdue"]).get(),
      invoicesCol().where("status", "==", "deposit_paid").get(),
      contractsCol().where("status", "==", "sent").get(),
      questionnairesCol().where("status", "==", "sent").get(),
      bookingRequestsCol().where("status", "==", "pending").get(),
    ]);
  const needsReplyCount = openThreadsSnap.docs.filter(
    (d) => d.data().lastMessageDirection === "inbound" && !d.data().archivedAt
  ).length;
  const balanceDueCount = depositPaidSnap.docs.filter((d) => {
    const invoice = d.data();
    return !invoice.archivedAt && invoice.balanceDueDate && invoice.balanceDueDate.toDate() < new Date();
  }).length;
  const awaitingPaymentCount = awaitingPaymentSnap.docs.filter((d) => !d.data().archivedAt).length;
  const awaitingSignatureCount = awaitingSignatureSnap.docs.filter((d) => !d.data().archivedAt).length;
  const awaitingResponseCount = awaitingResponseSnap.docs.filter((d) => !d.data().archivedAt).length;
  const now = Date.now();
  const pendingBookingsCount = pendingBookingsSnap.docs.filter((d) => d.data().expiresAt.toDate().getTime() > now).length;

  const navItems = [
    { href: "/admin/threads", label: "Inbox", count: needsReplyCount },
    { href: "/admin/contacts", label: "Contacts", count: 0 },
    { href: "/admin/calendar", label: "Calendar", count: pendingBookingsCount },
    { href: "/admin/invoices", label: "Invoices", count: awaitingPaymentCount + balanceDueCount },
    { href: "/admin/contracts", label: "Contracts", count: awaitingSignatureCount },
    { href: "/admin/questionnaires", label: "Questionnaires", count: awaitingResponseCount },
    { href: "/admin/templates", label: "Templates", count: 0 },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-surface px-4 py-6">
        <p className="mb-8 px-2 font-display text-lg text-foreground">Samsarafilmss</p>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-foreground/80 hover:bg-background hover:text-foreground"
            >
              <span>{item.label}</span>
              {item.count > 0 && (
                <span className="rounded-full bg-warm px-1.5 py-0.5 text-[10px] font-medium leading-none text-accent-contrast">
                  {item.count}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-8 border-t border-border px-2 pt-4">
          <p className="mb-2 truncate text-xs text-muted">{user.email}</p>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 bg-background px-8 py-6">{children}</main>
    </div>
  );
}
