import { randomUUID } from "crypto";
import type {
  AnalyticsEvent,
  AnalyticsEventType,
  Channel,
  ChatMessage,
  Contact,
  Conversation,
  ConversationState,
  Lead,
  UtmParams,
} from "../types";

// Interfaz que deben cumplir tanto el store en memoria (desarrollo local)
// como el store de Postgres (producción). Nadie fuera de persistence/
// debería importar directamente contra Postgres o contra los Maps de abajo.
export interface DataStore {
  getOrCreateConversation(
    channel: Channel,
    externalId: string,
    utm?: UtmParams
  ): Promise<Conversation>;
  saveConversation(conversation: Conversation): Promise<void>;
  appendMessage(conversationId: string, message: ChatMessage): Promise<void>;

  findContactByWhatsapp(whatsapp: string): Promise<Contact | undefined>;
  findContactByEmail(email: string): Promise<Contact | undefined>;
  upsertContact(contact: Partial<Contact> & { id?: string }): Promise<Contact>;

  createLead(lead: Omit<Lead, "id" | "createdAt">): Promise<Lead>;

  recordEvent(
    type: AnalyticsEventType,
    data: {
      conversationId?: string;
      channel?: Channel;
      metadata?: Record<string, unknown>;
      utm?: UtmParams;
    }
  ): Promise<void>;
}

function defaultState(): ConversationState {
  return {
    qualificationIndex: 0,
    qualificationAnswers: {},
    qualificationDone: false,
    awaitingContactData: false,
  };
}

export class MemoryStore implements DataStore {
  private conversations = new Map<string, Conversation>();
  private contacts = new Map<string, Contact>();
  private leads: Lead[] = [];
  private events: AnalyticsEvent[] = [];

  private keyFor(channel: Channel, externalId: string) {
    return `${channel}:${externalId}`;
  }

  async getOrCreateConversation(
    channel: Channel,
    externalId: string,
    utm?: UtmParams
  ): Promise<Conversation> {
    const key = this.keyFor(channel, externalId);
    const existing = [...this.conversations.values()].find(
      (c) => c.channel === channel && c.externalId === externalId
    );
    if (existing) return existing;

    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: randomUUID(),
      channel,
      externalId,
      history: [],
      state: defaultState(),
      utm,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(key, conversation);
    return conversation;
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    const key = this.keyFor(conversation.channel, conversation.externalId);
    conversation.updatedAt = new Date().toISOString();
    this.conversations.set(key, conversation);
  }

  async appendMessage(conversationId: string, message: ChatMessage): Promise<void> {
    const conversation = [...this.conversations.values()].find(
      (c) => c.id === conversationId
    );
    if (!conversation) return;
    conversation.history.push(message);
  }

  async findContactByWhatsapp(whatsapp: string): Promise<Contact | undefined> {
    return [...this.contacts.values()].find((c) => c.whatsapp === whatsapp);
  }

  async findContactByEmail(email: string): Promise<Contact | undefined> {
    return [...this.contacts.values()].find((c) => c.email === email);
  }

  async upsertContact(
    contact: Partial<Contact> & { id?: string }
  ): Promise<Contact> {
    // Merge conservador: solo se une a un contacto existente por coincidencia
    // EXACTA de whatsapp o email. Nunca por nombre parecido.
    const existing =
      (contact.id && this.contacts.get(contact.id)) ||
      (contact.whatsapp && (await this.findContactByWhatsapp(contact.whatsapp))) ||
      (contact.email && (await this.findContactByEmail(contact.email)));

    if (existing) {
      const merged: Contact = { ...existing, ...contact, id: existing.id };
      this.contacts.set(existing.id, merged);
      return merged;
    }

    const created: Contact = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...contact,
    };
    this.contacts.set(created.id, created);
    return created;
  }

  async createLead(lead: Omit<Lead, "id" | "createdAt">): Promise<Lead> {
    const created: Lead = {
      ...lead,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.leads.push(created);
    return created;
  }

  async recordEvent(
    type: AnalyticsEventType,
    data: {
      conversationId?: string;
      channel?: Channel;
      metadata?: Record<string, unknown>;
      utm?: UtmParams;
    }
  ): Promise<void> {
    this.events.push({
      id: randomUUID(),
      type,
      createdAt: new Date().toISOString(),
      ...data,
    });
  }

  // Solo para inspección en desarrollo (por ejemplo, un futuro /admin).
  debugSnapshot() {
    return {
      conversations: [...this.conversations.values()],
      contacts: [...this.contacts.values()],
      leads: this.leads,
      events: this.events,
    };
  }
}

let storeSingleton: DataStore | undefined;

export function getStore(): DataStore {
  if (storeSingleton) return storeSingleton;

  if (process.env.DATABASE_URL) {
    // Import diferido: pg es una dependencia opcional y solo se necesita
    // cuando de verdad hay una base de datos configurada.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PgStore } = require("./pg-store") as typeof import("./pg-store");
    storeSingleton = new PgStore(process.env.DATABASE_URL);
  } else {
    storeSingleton = new MemoryStore();
  }
  return storeSingleton;
}
