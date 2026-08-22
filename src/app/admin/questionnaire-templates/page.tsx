import { questionnaireTemplatesCol } from "@/lib/firestore-collections";
import { QuestionnaireTemplateForm } from "./questionnaire-template-form";
import { QuestionnaireTemplateRow } from "./questionnaire-template-row";

export default async function QuestionnaireTemplatesPage() {
  const snap = await questionnaireTemplatesCol().orderBy("name", "asc").get();
  const templates = snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, name: data.name, title: data.title, questions: data.questions };
  });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl text-foreground">Questionnaire templates</h1>
      <QuestionnaireTemplateForm />
      <div className="mt-6 space-y-3">
        {templates.length === 0 && <p className="text-sm text-muted">No questionnaire templates yet.</p>}
        {templates.map((t) => (
          <QuestionnaireTemplateRow key={t.id} template={t} />
        ))}
      </div>
    </div>
  );
}
