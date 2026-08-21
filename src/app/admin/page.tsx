import Link from "next/link";
import { threadsCol, invoicesCol } from "@/lib/firestore-collections";

export default async function AdminOverviewPage() {
  const [openThreadsSnap, draftInvoicesSnap, awaitingPaymentSnap] = await Promise.all([
    threadsCol().where("status", "==", "open").get(),
    invoicesCol().where("status", "==", "draft").get(),
    invoicesCol().where("status", "in", ["sent", "overdue"]).get(),
  ]);

  const stats = [
    { label: "Open threads", value: openThreadsSnap.size, href: "/admin/threads" },
    { label: "Draft invoices", value: draftInvoicesSnap.size, href: "/admin/invoices" },
    { label: "Awaiting payment", value: awaitingPaymentSnap.size, href: "/admin/invoices" },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-foreground">Overview</h1>
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-border bg-surface p-5 hover:border-accent"
          >
            <p className="font-display text-3xl text-foreground">{stat.value}</p>
            <p className="mt-1 text-sm text-muted">{stat.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
