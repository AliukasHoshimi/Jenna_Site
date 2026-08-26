import Link from "next/link";
import { questionnairesCol, contactsCol } from "@/lib/firestore-collections";
import { QuestionnaireList } from "./questionnaire-list";

export default async function QuestionnairesPage() {
  const snap = await questionnairesCol().orderBy("createdAt", "desc").get();
  const questionnaires = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((q) => !q.archivedAt);
  const contactIds = Array.from(new Set(questionnaires.map((q) => q.contactId)));
  const contactDocs = await Promise.all(contactIds.map((id) => contactsCol().doc(id).get()));
  const contactsById = new Map(contactDocs.filter((d) => d.exists).map((d) => [d.id, d.data()!]));

  const rows = questionnaires.map((q) => ({
    id: q.id,
    title: q.title,
    contactName: contactsById.get(q.contactId)?.name ?? "Unknown",
    status: q.status,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Questionnaires</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/questionnaires/archived" className="text-sm text-muted hover:text-foreground">
            Archived
          </Link>
          <Link
            href="/admin/questionnaire-templates"
            className="text-sm text-muted hover:text-foreground"
          >
            Manage templates
          </Link>
          <Link
            href="/admin/questionnaires/new"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast"
          >
            + New questionnaire
          </Link>
        </div>
      </div>
      <QuestionnaireList questionnaires={rows} />
    </div>
  );
}
