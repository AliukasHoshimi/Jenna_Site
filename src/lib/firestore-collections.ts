import "server-only";
import type {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { Contact, Thread, Message, Template, Invoice } from "@/types/firestore";

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
