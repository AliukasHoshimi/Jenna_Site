"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { QuestionEditor, type EditableQuestion } from "@/components/question-editor";

export function QuestionnaireTemplateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<EditableQuestion[]>([
    { id: crypto.randomUUID(), label: "", type: "short" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanQuestions = questions.filter((q) => q.label.trim());
    if (!name.trim() || !title.trim() || cleanQuestions.length === 0) {
      setError("Name, title, and at least one question are required.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/questionnaire-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, title, questions: cleanQuestions }),
    });
    setSubmitting(false);
    if (res.ok) {
      setOpen(false);
      setName("");
      setTitle("");
      setQuestions([{ id: crypto.randomUUID(), label: "", type: "short" }]);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save template.");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:border-accent"
      >
        + New questionnaire template
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <input
        required
        placeholder="Template name (e.g. Wedding questionnaire)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <input
        required
        placeholder="Title shown to the client (e.g. Tell us about your day)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <QuestionEditor questions={questions} onChange={setQuestions} />
      {error && <p className="text-sm text-warm">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save template"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-4 py-2 text-sm text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
