"use client";

import { useState, type FormEvent } from "react";

export function SignForm({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !agreed) {
      setError("Enter your full name and confirm you agree before signing.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/public/contracts/${token}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signerName: name }),
    });
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not sign this contract.");
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm">
        <p className="font-medium text-foreground">Signed — thank you!</p>
        <p className="mt-1 text-muted">A copy has been recorded. You can close this page.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <div>
        <label className="mb-1 block text-sm text-muted">Type your full name to sign</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <label className="flex items-start gap-2 text-sm text-foreground/80">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1"
        />
        I have read this contract and agree to its terms. I understand that typing my name above
        constitutes my legal signature.
      </label>
      {error && <p className="text-sm text-warm">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-warm px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-accent-contrast disabled:opacity-60"
      >
        {submitting ? "Signing…" : "Sign contract"}
      </button>
    </form>
  );
}
