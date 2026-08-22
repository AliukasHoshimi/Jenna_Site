"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionEditor, type EditableQuestion } from "@/components/question-editor";

interface QuestionnaireTemplate {
  id: string;
  name: string;
  title: string;
  questions: EditableQuestion[];
}

export function QuestionnaireTemplateRow({ template }: { template: QuestionnaireTemplate }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(template.name);
  const [title, setTitle] = useState(template.title);
  const [questions, setQuestions] = useState<EditableQuestion[]>(template.questions);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    await fetch(`/api/questionnaire-templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, title, questions: questions.filter((q) => q.label.trim()) }),
    });
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${template.name}"?`)) return;
    setBusy(true);
    await fetch(`/api/questionnaire-templates/${template.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (editing) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <QuestionEditor questions={questions} onChange={setQuestions} />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={busy}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-60"
          >
            Save
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
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{template.name}</p>
        <div className="flex gap-3 text-xs">
          <button onClick={() => setEditing(true)} className="text-muted hover:text-foreground">
            Edit
          </button>
          <button onClick={handleDelete} disabled={busy} className="text-warm hover:opacity-80">
            Delete
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">{template.title}</p>
      <ul className="mt-2 space-y-1">
        {template.questions.map((q) => (
          <li key={q.id} className="text-sm text-foreground/80">
            • {q.label} <span className="text-xs text-muted">({q.type === "long" ? "long answer" : "short answer"})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
