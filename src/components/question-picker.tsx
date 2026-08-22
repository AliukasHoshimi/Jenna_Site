"use client";

import { QUESTION_BANK } from "@/lib/questionnaire-presets";
import type { EditableQuestion } from "@/components/question-editor";

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random());
}

export function QuestionPicker({
  questions,
  onChange,
}: {
  questions: EditableQuestion[];
  onChange: (questions: EditableQuestion[]) => void;
}) {
  function toggle(label: string, type: "short" | "long", checked: boolean) {
    if (checked) {
      if (questions.some((q) => q.label === label)) return;
      onChange([...questions, { id: newId(), label, type }]);
    } else {
      onChange(questions.filter((q) => q.label !== label));
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-3">
      <p className="text-xs text-muted">Check the questions to include — pulled from common wedding/portrait intake forms.</p>
      {QUESTION_BANK.map((group) => (
        <div key={group.category}>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">{group.category}</p>
          <div className="space-y-1">
            {group.options.map((opt) => {
              const checked = questions.some((q) => q.label === opt.label);
              return (
                <label key={opt.label} className="flex items-center gap-2 text-sm text-foreground/90">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggle(opt.label, opt.type, e.target.checked)}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
