import { contractTemplatesCol } from "@/lib/firestore-collections";
import { ContractTemplateForm } from "./contract-template-form";
import { ContractTemplateRow } from "./contract-template-row";

export default async function ContractTemplatesPage() {
  const snap = await contractTemplatesCol().orderBy("name", "asc").get();
  const templates = snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, name: data.name, title: data.title, body: data.body };
  });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl text-foreground">Contract templates</h1>
      <ContractTemplateForm />
      <div className="mt-6 space-y-3">
        {templates.length === 0 && <p className="text-sm text-muted">No contract templates yet.</p>}
        {templates.map((t) => (
          <ContractTemplateRow key={t.id} template={t} />
        ))}
      </div>
    </div>
  );
}
