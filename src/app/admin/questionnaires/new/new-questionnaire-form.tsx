"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { QuestionEditor, type EditableQuestion } from "@/components/question-editor";
import { QuestionPicker } from "@/components/question-picker";
import { ContactSearchSelect } from "@/components/contact-search-select";

interface ContactOption {
  id: string;
  name: string;
  email: string;
}

interface QuestionnaireTemplateOption {
  id: string;
  name: string;
  title: string;
  questions: EditableQuestion[];
}

export function NewQuestionnaireForm({
  contacts,
  templates,
  defaultContactId,
  defaultThreadId,
}: {
  contacts: ContactOption[];
  templates: QuestionnaireTemplateOption[];
  defaultContactId?: string;
  defaultThreadId?: string;
}) {
  const router = useRouter();
  const [contactId, setContactId] = useState(defaultContactId ?? "");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTemplateSelect(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setTitle(template.title);
    setQuestions(template.questions.map((q) => ({ ...q })));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanQuestions = questions.filter((q) => q.label.trim());
    if (!contactId || !title.trim() || cleanQuestions.length === 0) {
      setError("Pick a client, a title, and at least one question.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/questionnaires", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId,
        threadId: defaultThreadId,
        title,
        answers: cleanQuestions.map((q) => ({ questionId: q.id, label: q.label, type: q.type, answer: "" })),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok && data.id) {
      router.push(`/admin/questionnaires/${data.id}`);
    } else {
      setError(data.error ?? "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-muted">Client</label>
        <ContactSearchSelect contacts={contacts} value={contactId} onChange={setContactId} />
      </div>

      {templates.length > 0 && (
        <div>
          <label className="mb-1 block text-sm text-muted">Start from a template</label>
          <select
            onChange={(e) => handleTemplateSelect(e.target.value)}
            defaultValue=""
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="" disabled>
              Choose a questionnaire template…
            </option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm text-muted">Title shown to the client</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted">Pick from common questions</label>
        <QuestionPicker questions={questions} onChange={setQuestions} />
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted">Selected questions (edit, reorder, or add your own)</label>
        <QuestionEditor questions={questions} onChange={setQuestions} />
      </div>

      {error && <p className="text-sm text-warm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Create draft questionnaire"}
      </button>
    </form>
  );
}
