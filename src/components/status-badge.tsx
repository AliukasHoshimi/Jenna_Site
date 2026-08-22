const STYLES: Record<string, string> = {
  open: "bg-accent/10 text-accent",
  closed: "bg-muted/10 text-muted",
  draft: "bg-muted/10 text-muted",
  sent: "bg-accent/10 text-accent",
  paid: "bg-success/10 text-success",
  signed: "bg-success/10 text-success",
  overdue: "bg-warm/10 text-warm",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        STYLES[status] ?? "bg-muted/10 text-muted"
      }`}
    >
      {status}
    </span>
  );
}
