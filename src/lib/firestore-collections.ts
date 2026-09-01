import "server-only";
import type {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type {
  Contact,
  Thread,
  Message,
  Template,
  Invoice,
  ContractTemplate,
  Contract,
  QuestionnaireTemplate,
  Questionnaire,
  GoogleCalendarSettings,
  CalendarEvent,
  BookingRequest,
  BookingSettings,
  BookingSessionType,
  InvoiceLineItemPreset,
} from "@/types/firestore";

function converter<T extends FirebaseFirestore.DocumentData>(): FirestoreDataConverter<T> {
  return {
    toFirestore: (data) => data as FirebaseFirestore.DocumentData,
    fromFirestore: (snapshot: QueryDocumentSnapshot) => snapshot.data() as T,
  };
}

export function contactsCol() {
  return adminDb().collection("contacts").withConverter(converter<Contact>());
}

export function threadsCol() {
  return adminDb().collection("threads").withConverter(converter<Thread>());
}

export function messagesCol(threadId: string) {
  return threadsCol().doc(threadId).collection("messages").withConverter(converter<Message>());
}

export function templatesCol() {
  return adminDb().collection("templates").withConverter(converter<Template>());
}

export function invoicesCol() {
  return adminDb().collection("invoices").withConverter(converter<Invoice>());
}

export function contractTemplatesCol() {
  return adminDb().collection("contractTemplates").withConverter(converter<ContractTemplate>());
}

export function contractsCol() {
  return adminDb().collection("contracts").withConverter(converter<Contract>());
}

export function questionnaireTemplatesCol() {
  return adminDb().collection("questionnaireTemplates").withConverter(converter<QuestionnaireTemplate>());
}

export function questionnairesCol() {
  return adminDb().collection("questionnaires").withConverter(converter<Questionnaire>());
}

export function googleCalendarSettingsDoc() {
  return adminDb()
    .collection("settings")
    .doc("googleCalendar")
    .withConverter(converter<GoogleCalendarSettings>());
}

export function calendarEventsCol() {
  return adminDb().collection("calendarEvents").withConverter(converter<CalendarEvent>());
}

export function bookingRequestsCol() {
  return adminDb().collection("bookingRequests").withConverter(converter<BookingRequest>());
}

export function bookingSettingsDoc() {
  return adminDb().collection("settings").doc("booking").withConverter(converter<BookingSettings>());
}

export function bookingSessionTypesCol() {
  return adminDb().collection("bookingSessionTypes").withConverter(converter<BookingSessionType>());
}

export function invoiceLineItemPresetsCol() {
  return adminDb().collection("invoiceLineItemPresets").withConverter(converter<InvoiceLineItemPreset>());
}
