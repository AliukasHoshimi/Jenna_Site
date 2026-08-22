"use client";

export interface EditableQuestion {
  id: string;
  label: string;
  type: "short" | "long";
}

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random());
}

export function QuestionEditor({
  questions,
  onChange,
}: {
  questions: EditableQuestion[];
  onChange: (questions: EditableQuestion[]) => void;
}) {
  function updateQuestion(index: number, field: keyof EditableQuestion, value: string) {
    onChange(questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  }

  function addQuestion() {
    onChange([...questions, { id: newId(), label: "", type: "short" }]);
  }

  function removeQuestion(index: number) {
    onChange(questions.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {questions.map((q, i) => (
        <div key={q.id} className="flex gap-2">
          <input
            placeholder="Question"
            value={q.label}
            onChange={(e) => updateQuestion(i, "label", e.target.value)}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <select
            value={q.type}
            onChange={(e) => updateQuestion(i, "type", e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="short">Short answer</option>
            <option value="long">Long answer</option>
          </select>
          {questions.length > 1 && (
            <button
              type="button"
              onClick={() => removeQuestion(i)}
              className="text-xs text-muted hover:text-warm"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={addQuestion} className="text-xs text-accent hover:underline">
        + Add question
      </button>
    </div>
  );
}
