"use client";

import { useState } from "react";
import { TemplateForm } from "./template-form";
import { TemplateRow } from "./template-row";
import { InvoicePresetForm } from "./invoice-preset-form";
import { InvoicePresetRow } from "./invoice-preset-row";
import { SessionTypeForm } from "./session-type-form";
import { SessionTypeRow } from "./session-type-row";
import { ContractTemplateForm } from "./contract-template-form";
import { ContractTemplateRow } from "./contract-template-row";
import { QuestionnaireTemplateForm } from "./questionnaire-template-form";
import { QuestionnaireTemplateRow } from "./questionnaire-template-row";
import type { EditableQuestion } from "@/components/question-editor";

export type TabKey = "inbox" | "invoices" | "booking" | "contracts" | "questionnaires";

const TABS: { key: TabKey; label: string }[] = [
  { key: "inbox", label: "Inbox responses" },
  { key: "invoices", label: "Invoice presets" },
  { key: "booking", label: "Booking session types" },
  { key: "contracts", label: "Contract templates" },
  { key: "questionnaires", label: "Questionnaires" },
];

interface ReplyTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}
interface InvoicePreset {
  id: string;
  group: string;
  description: string;
}
interface SessionType {
  id: string;
  name: string;
  durationMinutes: number;
  description: string | null;
}
interface ContractTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
}
interface QuestionnaireTemplate {
  id: string;
  name: string;
  title: string;
  questions: EditableQuestion[];
}

export function TemplatesHub({
  initialTab,
  replyTemplates,
  invoicePresets,
  sessionTypes,
  contractTemplates,
  questionnaireTemplates,
}: {
  initialTab: TabKey;
  replyTemplates: ReplyTemplate[];
  invoicePresets: InvoicePreset[];
  sessionTypes: SessionType[];
  contractTemplates: ContractTemplate[];
  questionnaireTemplates: QuestionnaireTemplate[];
}) {
  const [tab, setTab] = useState<TabKey>(initialTab);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl text-foreground">Templates</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === t.key
                ? "bg-accent text-accent-contrast"
                : "border border-border bg-surface text-foreground hover:border-accent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "inbox" && (
        <div>
          <TemplateForm />
          <div className="mt-6 space-y-3">
            {replyTemplates.length === 0 && <p className="text-sm text-muted">No templates yet.</p>}
            {replyTemplates.map((t) => (
              <TemplateRow key={t.id} template={t} />
            ))}
          </div>
        </div>
      )}

      {tab === "invoices" && (
        <div>
          <InvoicePresetForm />
          <div className="mt-6 space-y-3">
            {invoicePresets.length === 0 && <p className="text-sm text-muted">No presets yet.</p>}
            {invoicePresets.map((p) => (
              <InvoicePresetRow key={p.id} preset={p} />
            ))}
          </div>
        </div>
      )}

      {tab === "booking" && (
        <div>
          <SessionTypeForm />
          <div className="mt-6 space-y-3">
            {sessionTypes.length === 0 && <p className="text-sm text-muted">No session types yet.</p>}
            {sessionTypes.map((s) => (
              <SessionTypeRow key={s.id} sessionType={s} canDelete={sessionTypes.length > 1} />
            ))}
          </div>
        </div>
      )}

      {tab === "contracts" && (
        <div>
          <ContractTemplateForm />
          <div className="mt-6 space-y-3">
            {contractTemplates.length === 0 && <p className="text-sm text-muted">No contract templates yet.</p>}
            {contractTemplates.map((t) => (
              <ContractTemplateRow key={t.id} template={t} />
            ))}
          </div>
        </div>
      )}

      {tab === "questionnaires" && (
        <div>
          <QuestionnaireTemplateForm />
          <div className="mt-6 space-y-3">
            {questionnaireTemplates.length === 0 && (
              <p className="text-sm text-muted">No questionnaire templates yet.</p>
            )}
            {questionnaireTemplates.map((t) => (
              <QuestionnaireTemplateRow key={t.id} template={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
