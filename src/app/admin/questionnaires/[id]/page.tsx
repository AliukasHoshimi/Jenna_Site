import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { questionnairesCol, contactsCol } from "@/lib/firestore-collections";
import { StatusBadge } from "@/components/status-badge";
import { LocalDateTime } from "@/components/local-date-time";
import { QuestionnaireEditor } from "./questionnaire-editor";
import { SendQuestionnaireButton } from "./send-questionnaire-button";

export default async function QuestionnaireDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snap = await questionnairesCol().doc(id).get();
  if (!snap.exists) notFound();
  const questionnaire = snap.data()!;
  const contactSnap = await contactsCol().doc(questionnaire.contactId).get();
  const contact = contactSnap.data();

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const respondUrl = `${protocol}://${host}/respond/${questionnaire.respondToken}`;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">{questionnaire.title}</h1>
          <p className="text-sm text-muted">{contact?.name}</p>
        </div>
        <StatusBadge status={questionnaire.status} />
      </div>

      {questionnaire.status === "sent" && (
        <div className="mb-6 rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="text-muted">
            Awaiting response — sent{" "}
            {questionnaire.sentAt && <LocalDateTime iso={questionnaire.sentAt.toDate().toISOString()} />}
          </p>
          <p className="mt-2 break-all text-xs text-muted">
            Link: <span className="text-foreground">{respondUrl}</span>
          </p>
        </div>
      )}

      {questionnaire.status === "completed" && (
        <p className="mb-4 text-sm text-muted">
          Completed{" "}
          {questionnaire.completedAt && <LocalDateTime iso={questionnaire.completedAt.toDate().toISOString()} />}
        </p>
      )}

      <QuestionnaireEditor
        questionnaireId={id}
        title={questionnaire.title}
        answers={questionnaire.answers}
        status={questionnaire.status}
      />

      {questionnaire.status === "draft" && (
        <div className="mt-4">
          <SendQuestionnaireButton questionnaireId={id} />
        </div>
      )}
    </div>
  );
}
