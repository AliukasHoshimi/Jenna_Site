import Link from "next/link";
import { questionnairesCol, contactsCol } from "@/lib/firestore-collections";
import { ArchivedQuestionnaireList } from "./archived-questionnaire-list";

export default async function ArchivedQuestionnairesPage() {
  const snap = await questionnairesCol().orderBy("createdAt", "desc").get();
  const archived = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((q) => q.archivedAt);

  const contactIds = Array.from(new Set(archived.map((q) => q.contactId)));
  const contactDocs = await Promise.all(contactIds.map((id) => contactsCol().doc(id).get()));
  const contactsById = new Map(contactDocs.filter((d) => d.exists).map((d) => [d.id, d.data()!]));

  const rows = archived.map((q) => {
    const contact = contactsById.get(q.contactId);
    return {
      id: q.id,
      title: q.title,
      contactName: contact?.name ?? "Unknown",
      contactEmail: contact?.email ?? "",
      status: q.status,
      createdAtIso: q.createdAt.toDate().toISOString(),
    };
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Archived questionnaires</h1>
        <Link href="/admin/questionnaires" className="text-sm text-muted hover:text-foreground">
          Back to questionnaires
        </Link>
      </div>
      <ArchivedQuestionnaireList questionnaires={rows} />
    </div>
  );
}
