import Link from "next/link";
import { questionnairesCol, contactsCol } from "@/lib/firestore-collections";
import { StatusBadge } from "@/components/status-badge";

export default async function QuestionnairesPage() {
  const snap = await questionnairesCol().orderBy("createdAt", "desc").get();
  const questionnaires = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const contactIds = Array.from(new Set(questionnaires.map((q) => q.contactId)));
  const contactDocs = await Promise.all(contactIds.map((id) => contactsCol().doc(id).get()));
  const contactsById = new Map(contactDocs.filter((d) => d.exists).map((d) => [d.id, d.data()!]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Questionnaires</h1>
        <div className="flex items-center gap-3">
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
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {questionnaires.length === 0 && <p className="p-4 text-sm text-muted">No questionnaires yet.</p>}
        {questionnaires.map((q) => {
          const contact = contactsById.get(q.contactId);
          return (
            <Link
              key={q.id}
              href={`/admin/questionnaires/${q.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-background"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{q.title}</p>
                <p className="text-xs text-muted">{contact?.name ?? "Unknown"}</p>
              </div>
              <StatusBadge status={q.status} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
