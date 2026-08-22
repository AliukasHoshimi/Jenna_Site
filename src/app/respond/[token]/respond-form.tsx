"use client";

import { useState, type FormEvent } from "react";

interface Question {
  questionId: string;
  label: string;
  type: "short" | "long";
}

export function RespondForm({ token, questions }: { token: string; questions: Question[] }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/public/questionnaires/${token}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: questions.map((q) => ({ questionId: q.questionId, answer: values[q.questionId] ?? "" })),
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not submit your answers.");
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm">
        <p className="font-medium text-foreground">Submitted — thank you!</p>
        <p className="mt-1 text-muted">You can close this page.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-surface p-5">
      {questions.map((q) => (
        <div key={q.questionId}>
          <label className="mb-1 block text-sm text-foreground">{q.label}</label>
          {q.type === "long" ? (
            <textarea
              rows={4}
              value={values[q.questionId] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [q.questionId]: e.target.value }))}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          ) : (
            <input
              value={values[q.questionId] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [q.questionId]: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          )}
        </div>
      ))}
      {error && <p className="text-sm text-warm">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-warm px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-accent-contrast disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
