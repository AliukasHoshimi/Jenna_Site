const STYLES: Record<string, string> = {
  open: "bg-accent/10 text-accent",
  closed: "bg-muted/10 text-muted",
  draft: "bg-muted/10 text-muted",
  sent: "bg-accent/10 text-accent",
  paid: "bg-success/10 text-success",
  signed: "bg-success/10 text-success",
  deposit_paid: "bg-accent/10 text-accent",
  overdue: "bg-warm/10 text-warm",
  balance_due: "bg-warm/10 text-warm",
  inquiry: "bg-muted/10 text-muted",
  booked: "bg-accent/10 text-accent",
  active: "bg-warm/10 text-warm",
  delivered: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        STYLES[status] ?? "bg-muted/10 text-muted"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
