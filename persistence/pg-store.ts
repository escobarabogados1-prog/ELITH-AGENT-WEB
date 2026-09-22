import type { Pool } from "pg";
import type {
  AnalyticsEventType,
  Channel,
  ChatMessage,
  Contact,
  Conversation,
  Lead,
  UtmParams,
} from "../types";
import type { DataStore } from "./store";

/**
 * Implementación de producción. Cumple exactamente la misma interfaz
 * DataStore que MemoryStore — core/orchestrator.ts nunca sabe cuál de las
 * dos está usando.
 */
export class PgStore implements DataStore {
  private pool: Pool;

  constructor(connectionString: string) {
    // Import perezoso: 'pg' es opcionalDependency y solo se carga si
    // DATABASE_URL existe (ver persistence/store.ts).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Pool: PgPool } = require("pg") as typeof import("pg");
    this.pool = new PgPool({ connectionString });
  }

  async getOrCreateConversation(
    channel: Channel,
    externalId: string,
    utm?: UtmParams
  ): Promise<Conversation> {
    const existing = await this.pool.query(
      `select * from conversations where channel = $1 and external_id = $2`,
      [channel, externalId]
    );
    if (existing.rows[0]) return this.mapConversation(existing.rows[0]);

    const inserted = await this.pool.query(
      `insert into conversations (channel, external_id, state, utm)
       values ($1, $2, $3, $4) returning *`,
      [
        channel,
        externalId,
        JSON.stringify({
          qualificationIndex: 0,
          qualificationAnswers: {},
          qualificationDone: false,
          awaitingContactData: false,
        }),
        utm ? JSON.stringify(utm) : null,
      ]
    );
    return this.mapConversation(inserted.rows[0]);
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    await this.pool.query(
      `update conversations
       set state = $1, contact_id = $2, updated_at = now()
       where id = $3`,
      [JSON.stringify(conversation.state), conversation.contactId ?? null, conversation.id]
    );
  }

  async appendMessage(conversationId: string, message: ChatMessage): Promise<void> {
    await this.pool.query(
      `insert into messages (conversation_id, role, text) values ($1, $2, $3)`,
      [conversationId, message.role, message.text]
    );
  }

  async findContactByWhatsapp(whatsapp: string): Promise<Contact | undefined> {
    const res = await this.pool.query(`select * from contacts where whatsapp = $1`, [whatsapp]);
    return res.rows[0] ? this.mapContact(res.rows[0]) : undefined;
  }

  async findContactByEmail(email: string): Promise<Contact | undefined> {
    const res = await this.pool.query(`select * from contacts where email = $1`, [email]);
    return res.rows[0] ? this.mapContact(res.rows[0]) : undefined;
  }

  async upsertContact(contact: Partial<Contact> & { id?: string }): Promise<Contact> {
    // Merge conservador: solo por id existente, whatsapp exacto o email exacto.
    const existing =
      (contact.id &&
        (await this.pool.query(`select * from contacts where id = $1`, [contact.id])).rows[0]) ||
      (contact.whatsapp && (await this.findContactByWhatsapp(contact.whatsapp))) ||
      (contact.email && (await this.findContactByEmail(contact.email)));

    if (existing) {
      const merged = { ...this.mapContact(existing), ...contact };
      const res = await this.pool.query(
        `update contacts set name = $1, whatsapp = $2, email = $3, city = $4, country = $5
         where id = $6 returning *`,
        [merged.name, merged.whatsapp, merged.email, merged.city, merged.country, merged.id]
      );
      return this.mapContact(res.rows[0]);
    }

    const res = await this.pool.query(
      `insert into contacts (name, whatsapp, email, city, country)
       values ($1, $2, $3, $4, $5) returning *`,
      [contact.name, contact.whatsapp, contact.email, contact.city, contact.country]
    );
    return this.mapContact(res.rows[0]);
  }

  async createLead(lead: Omit<Lead, "id" | "createdAt">): Promise<Lead> {
    const res = await this.pool.query(
      `insert into leads (contact_id, legal_area, service_id, summary, urgency, source_channel, utm, status)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
      [
        lead.contactId,
        lead.legalArea ?? null,
        lead.serviceId ?? null,
        lead.summary,
        lead.urgency ?? null,
        lead.sourceChannel,
        lead.utm ? JSON.stringify(lead.utm) : null,
        lead.status,
      ]
    );
    return this.mapLead(res.rows[0]);
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
    await this.pool.query(
      `insert into analytics_events (type, conversation_id, channel, metadata, utm)
       values ($1, $2, $3, $4, $5)`,
      [
        type,
        data.conversationId ?? null,
        data.channel ?? null,
        data.metadata ? JSON.stringify(data.metadata) : null,
        data.utm ? JSON.stringify(data.utm) : null,
      ]
    );
  }

  private mapConversation(row: Record<string, unknown>): Conversation {
    return {
      id: row.id as string,
      channel: row.channel as Channel,
      externalId: row.external_id as string,
      contactId: (row.contact_id as string) ?? undefined,
      history: [],
      state: row.state as Conversation["state"],
      utm: (row.utm as UtmParams) ?? undefined,
      createdAt: new Date(row.created_at as string).toISOString(),
      updatedAt: new Date(row.updated_at as string).toISOString(),
    };
  }

  private mapContact(row: Record<string, unknown>): Contact {
    return {
      id: row.id as string,
      name: (row.name as string) ?? undefined,
      whatsapp: (row.whatsapp as string) ?? undefined,
      email: (row.email as string) ?? undefined,
      city: (row.city as string) ?? undefined,
      country: (row.country as string) ?? undefined,
      createdAt: new Date(row.created_at as string).toISOString(),
    };
  }

  private mapLead(row: Record<string, unknown>): Lead {
    return {
      id: row.id as string,
      contactId: row.contact_id as string,
      legalArea: (row.legal_area as string) ?? undefined,
      serviceId: (row.service_id as string) ?? undefined,
      summary: row.summary as string,
      urgency: (row.urgency as Lead["urgency"]) ?? undefined,
      sourceChannel: row.source_channel as Channel,
      utm: (row.utm as UtmParams) ?? undefined,
      status: row.status as Lead["status"],
      createdAt: new Date(row.created_at as string).toISOString(),
    };
  }
}
