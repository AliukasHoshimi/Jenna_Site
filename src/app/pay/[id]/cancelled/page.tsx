export default function PaymentCancelledPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="mb-1 font-display text-lg tracking-wide text-foreground">SAMSARAFILMSS</p>
      <h1 className="mb-3 font-display text-3xl text-foreground">Payment cancelled</h1>
      <p className="max-w-sm text-sm text-muted">
        No charge was made. If you still need to pay, use the payment link from your invoice email, or reply to
        that email and we&apos;ll send a new one.
      </p>
    </main>
  );
}
