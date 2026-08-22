"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionEditor, type EditableQuestion } from "@/components/question-editor";

interface Answer {
  questionId: string;
  label: string;
  type: "short" | "long";
  answer: string;
}

export function QuestionnaireEditor({
  questionnaireId,
  title,
  answers,
  status,
}: {
  questionnaireId: string;
  title: string;
  answers: Answer[];
  status: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [questions, setQuestions] = useState<EditableQuestion[]>(
    answers.map((a) => ({ id: a.questionId, label: a.label, type: a.type }))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const cleanQuestions = questions.filter((q) => q.label.trim());
    if (!titleValue.trim() || cleanQuestions.length === 0) {
      setError("Title and at least one question are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/questionnaires/${questionnaireId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: titleValue,
        answers: cleanQuestions.map((q) => ({ questionId: q.id, label: q.label, type: q.type, answer: "" })),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save changes.");
    }
  }

  if (status !== "draft") {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="divide-y divide-border">
          {answers.map((a) => (
            <div key={a.questionId} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-medium text-foreground">{a.label}</p>
              {status === "completed" ? (
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">
                  {a.answer || <span className="text-muted">(left blank)</span>}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted">Waiting on a response…</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <input
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <QuestionEditor questions={questions} onChange={setQuestions} />
        {error && <p className="text-sm text-warm">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={busy}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-md px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 flex justify-end">
        <button
          onClick={() => setEditing(true)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:border-accent"
        >
          Edit
        </button>
      </div>
      <ul className="space-y-1">
        {answers.map((a) => (
          <li key={a.questionId} className="text-sm text-foreground/80">
            • {a.label} <span className="text-xs text-muted">({a.type === "long" ? "long answer" : "short answer"})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
