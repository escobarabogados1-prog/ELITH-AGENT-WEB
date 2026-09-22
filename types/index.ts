// Tipos de dominio. No dependen de Next.js ni de React: son el lenguaje común
// entre core/, catalog/, rules/, persistence/ y channels/.

export type Channel = "web" | "whatsapp";

export interface IncomingMessage {
  channel: Channel;
  conversationId: string;
  externalId: string;
  text: string;
}

export interface OrchestratorAction {
  type: "whatsapp_cta" | "ask_contact_data";
  label: string;
  payload?: Record<string, unknown>;
}

export interface OrchestratorReply {
  text: string;
  actions: OrchestratorAction[];
  areaDetected?: string;
  serviceDetected?: string;
  leadCreated?: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export type Intent = "informacion" | "cotizacion" | "contratacion" | "urgencia";

export interface ConversationState {
  area?: string;
  serviceId?: string;
  qualificationIndex: number;
  qualificationAnswers: Record<string, string>;
  qualificationDone: boolean;
  intent?: Intent;
  leadId?: string;
  awaitingContactData: boolean;
}

export interface Conversation {
  id: string;
  channel: Channel;
  externalId: string;
  contactId?: string;
  history: ChatMessage[];
  state: ConversationState;
  utm?: UtmParams;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name?: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  country?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  contactId: string;
  legalArea?: string;
  serviceId?: string;
  summary: string;
  urgency?: "baja" | "media" | "alta";
  sourceChannel: Channel;
  utm?: UtmParams;
  status: "nuevo" | "contactado" | "cerrado";
  createdAt: string;
}

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export type AnalyticsEventType =
  | "landing_view"
  | "chat_started"
  | "area_detected"
  | "service_detected"
  | "qualification_started"
  | "qualification_completed"
  | "lead_created"
  | "whatsapp_clicked"
  | "service_viewed";

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  conversationId?: string;
  channel?: Channel;
  metadata?: Record<string, unknown>;
  utm?: UtmParams;
  createdAt: string;
}
