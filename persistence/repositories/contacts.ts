import { getStore } from "../store";
import type { Contact } from "../../types";

export function upsertContact(contact: Partial<Contact> & { id?: string }): Promise<Contact> {
  return getStore().upsertContact(contact);
}

export function findContactByWhatsapp(whatsapp: string): Promise<Contact | undefined> {
  return getStore().findContactByWhatsapp(whatsapp);
}
