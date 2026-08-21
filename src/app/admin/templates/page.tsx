import { templatesCol } from "@/lib/firestore-collections";
import { TemplateForm } from "./template-form";
import { TemplateRow } from "./template-row";

export default async function TemplatesPage() {
  const snap = await templatesCol().orderBy("name", "asc").get();
  const templates = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl text-foreground">Reply templates</h1>
      <TemplateForm />
      <div className="mt-6 space-y-3">
        {templates.length === 0 && <p className="text-sm text-muted">No templates yet.</p>}
        {templates.map((t) => (
          <TemplateRow key={t.id} template={t} />
        ))}
      </div>
    </div>
  );
}
