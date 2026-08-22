import { contactsCol, questionnaireTemplatesCol } from "@/lib/firestore-collections";
import { NewQuestionnaireForm } from "./new-questionnaire-form";

export default async function NewQuestionnairePage({
  searchParams,
}: {
  searchParams: Promise<{ contactId?: string; threadId?: string }>;
}) {
  const { contactId, threadId } = await searchParams;
  const [contactsSnap, templatesSnap] = await Promise.all([
    contactsCol().orderBy("lastActivityAt", "desc").get(),
    questionnaireTemplatesCol().orderBy("name", "asc").get(),
  ]);

  const contacts = contactsSnap.docs.map((d) => ({ id: d.id, name: d.data().name, email: d.data().email }));
  const templates = templatesSnap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, name: data.name, title: data.title, questions: data.questions };
  });

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-2xl text-foreground">New questionnaire</h1>
      <NewQuestionnaireForm
        contacts={contacts}
        templates={templates}
        defaultContactId={contactId}
        defaultThreadId={threadId}
      />
    </div>
  );
}
