import { questionnairesCol } from "@/lib/firestore-collections";
import { RespondForm } from "./respond-form";

export default async function RespondPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const snap = await questionnairesCol().where("respondToken", "==", token).limit(1).get();

  if (snap.empty) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
        <p className="text-sm text-muted">This link isn&apos;t valid.</p>
      </main>
    );
  }

  const doc = snap.docs[0];
  const questionnaire = doc.data();

  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-12">
      <p className="mb-1 font-display text-lg tracking-wide text-foreground">SAMSARAFILMSS</p>
      <h1 className="mb-6 font-display text-2xl text-foreground">{questionnaire.title}</h1>

      {questionnaire.status === "completed" ? (
        <div className="rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="font-medium text-foreground">Already completed — thank you!</p>
        </div>
      ) : questionnaire.status !== "sent" ? (
        <p className="text-sm text-muted">This isn&apos;t ready to be answered yet.</p>
      ) : (
        <RespondForm token={token} questions={questionnaire.answers} />
      )}
    </main>
  );
}
