import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/threads", label: "Inbox" },
  { href: "/admin/contacts", label: "Contacts" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/templates", label: "Templates" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Every /admin route is protected here: no nested page renders until the
  // session cookie has been verified server-side against Firebase Auth.
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-surface px-4 py-6">
        <p className="mb-8 px-2 font-display text-lg text-foreground">Samsarafilmss</p>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-2 py-2 text-sm text-foreground/80 hover:bg-background hover:text-foreground"
            >
              {item.label}
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
