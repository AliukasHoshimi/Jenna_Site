import {
  templatesCol,
  invoiceLineItemPresetsCol,
  bookingSessionTypesCol,
  contractTemplatesCol,
  questionnaireTemplatesCol,
} from "@/lib/firestore-collections";
import { TemplatesHub, type TabKey } from "./templates-hub";

const VALID_TABS: TabKey[] = ["inbox", "invoices", "booking", "contracts", "questionnaires"];

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = VALID_TABS.includes(tab as TabKey) ? (tab as TabKey) : "inbox";

  const [templatesSnap, presetsSnap, sessionTypesSnap, contractTemplatesSnap, questionnaireTemplatesSnap] =
    await Promise.all([
      templatesCol().orderBy("name", "asc").get(),
      invoiceLineItemPresetsCol().orderBy("group", "asc").orderBy("description", "asc").get(),
      bookingSessionTypesCol().orderBy("createdAt", "asc").get(),
      contractTemplatesCol().orderBy("name", "asc").get(),
      questionnaireTemplatesCol().orderBy("name", "asc").get(),
    ]);

  const replyTemplates = templatesSnap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, name: data.name, subject: data.subject, body: data.body };
  });
  const invoicePresets = presetsSnap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, group: data.group, description: data.description };
  });
  const sessionTypes = sessionTypesSnap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, name: data.name, durationMinutes: data.durationMinutes, description: data.description };
  });
  const contractTemplates = contractTemplatesSnap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, name: data.name, title: data.title, body: data.body };
  });
  const questionnaireTemplates = questionnaireTemplatesSnap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, name: data.name, title: data.title, questions: data.questions };
  });

  return (
    <TemplatesHub
      initialTab={initialTab}
      replyTemplates={replyTemplates}
      invoicePresets={invoicePresets}
      sessionTypes={sessionTypes}
      contractTemplates={contractTemplates}
      questionnaireTemplates={questionnaireTemplates}
    />
  );
}
