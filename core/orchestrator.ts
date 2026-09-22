// core/orchestrator.ts
//
// REGLA DE ARQUITECTURA: este archivo y todo lo que importa desde aquí hacia
// abajo (classifier, qualification, lead-decision, response-builder, rules,
// catalog, ai/*, persistence/*) NO puede importar "next", "react",
// "next/server", cookies, headers ni nada relacionado con streaming HTTP.
// Los adaptadores de canal (app/api/chat/route.ts, channels/whatsapp/adapter.ts)
// son los únicos que conocen el transporte.

import { getServiceById } from "../catalog/repository";
import { classifyService } from "./classifier";
import { detectIntent } from "./intent";
import { evaluateLeadOpportunity } from "./lead-decision";
import { advanceQualification, firstQuestion } from "./qualification";
import { buildReply } from "./response-builder";
import {
  appendMessage,
  getOrCreateConversation,
  saveConversation,
} from "../persistence/repositories/conversations";
import { recordEvent } from "../persistence/repositories/analytics";
import { createLead } from "../persistence/repositories/leads";
import { upsertContact } from "../persistence/repositories/contacts";
import type { IncomingMessage, OrchestratorReply, UtmParams } from "../types";

export interface ProcessMessageInput extends IncomingMessage {
  utm?: UtmParams;
  // Datos de contacto que el usuario pudo haber dado en el mismo turno
  // (por ejemplo, a través de un mini-formulario embebido en el chat).
  contactData?: { name?: string; whatsapp?: string; email?: string; city?: string };
}

/**
 * Único punto de entrada del motor comercial. Los adaptadores de canal
 * (web hoy, WhatsApp en el futuro) solo traducen su formato de transporte
 * a esta llamada y traducen esta respuesta de vuelta a su formato.
 */
export async function processMessage(
  input: ProcessMessageInput
): Promise<OrchestratorReply> {
  const conversation = await getOrCreateConversation(
    input.channel,
    input.externalId,
    input.utm
  );

  if (conversation.history.length === 0) {
    await recordEvent("chat_started", {
      conversationId: conversation.id,
      channel: input.channel,
      utm: input.utm,
    });
  }

  await appendMessage(conversation.id, {
    role: "user",
    text: input.text,
    timestamp: new Date().toISOString(),
  });

  const intent = detectIntent(input.text);
  conversation.state.intent = intent;

  // 1) Clasificación de área/servicio, si todavía no se había detectado.
  let service = conversation.state.serviceId
    ? getServiceById(conversation.state.serviceId)
    : undefined;

  let justDetected = false;
  if (!service) {
    service = classifyService(input.text);
    if (service) {
      conversation.state.area = service.legal_area;
      conversation.state.serviceId = service.id;
      conversation.state.qualificationIndex = 0;
      conversation.state.qualificationAnswers = {};
      conversation.state.qualificationDone = false;
      justDetected = true;

      await recordEvent("area_detected", {
        conversationId: conversation.id,
        channel: input.channel,
        metadata: { area: service.legal_area },
      });
      await recordEvent("service_detected", {
        conversationId: conversation.id,
        channel: input.channel,
        metadata: { serviceId: service.id },
      });
    }
  }

  // 2) Precalificación (solo si ya hay servicio detectado y aún no terminó).
  let nextQuestion: string | undefined;
  if (service && !conversation.state.qualificationDone) {
    if (justDetected) {
      await recordEvent("qualification_started", {
        conversationId: conversation.id,
        channel: input.channel,
        metadata: { serviceId: service.id },
      });
      nextQuestion = firstQuestion(service);
    } else {
      const result = advanceQualification(
        service,
        conversation.state,
        input.text
      );
      conversation.state.qualificationAnswers = result.updatedAnswers;
      conversation.state.qualificationIndex = result.nextIndex;
      conversation.state.qualificationDone = result.done;
      nextQuestion = result.nextQuestion;

      if (result.done) {
        await recordEvent("qualification_completed", {
          conversationId: conversation.id,
          channel: input.channel,
          metadata: { serviceId: service.id },
        });
      }
    }
  }

  // 3) Decisión comercial: ¿hay oportunidad de lead?
  const hasContactData = Boolean(
    conversation.contactId || input.contactData?.whatsapp || input.contactData?.email
  );
  const decision = evaluateLeadOpportunity(
    service,
    conversation.state,
    intent,
    hasContactData
  );

  let leadCreated = false;
  if (decision.hasCommercialIntent && !conversation.state.leadId) {
    if (input.contactData && (input.contactData.whatsapp || input.contactData.email)) {
      const contact = await upsertContact({
        id: conversation.contactId,
        ...input.contactData,
      });
      conversation.contactId = contact.id;

      const lead = await createLead({
        contactId: contact.id,
        legalArea: service?.legal_area,
        serviceId: service?.id,
        summary: decision.summary,
        urgency: decision.urgency,
        sourceChannel: input.channel,
        utm: conversation.utm,
        status: "nuevo",
      });
      conversation.state.leadId = lead.id;
      conversation.state.awaitingContactData = false;
      leadCreated = true;

      await recordEvent("lead_created", {
        conversationId: conversation.id,
        channel: input.channel,
        metadata: { leadId: lead.id },
        utm: conversation.utm,
      });
    } else {
      conversation.state.awaitingContactData = true;
    }
  }

  // 4) Redacción de la respuesta (el modelo interpreta; no decide datos).
  const guidance = conversation.state.awaitingContactData
    ? "Para conectarte con un abogado, ¿me confirmas tu nombre y tu WhatsApp?"
    : leadCreated
      ? "Perfecto, ya tengo tus datos. Toca el botón de WhatsApp para hablar directamente con un abogado de ELITH IA LEGAL TECH."
      : nextQuestion;

  const built = await buildReply({
    userText: input.text,
    service,
    nextQuestion: guidance,
    answersSoFar: conversation.state.qualificationAnswers,
    offerWhatsapp: decision.hasCommercialIntent && !conversation.state.awaitingContactData,
    contactName: input.contactData?.name,
  });

  await appendMessage(conversation.id, {
    role: "assistant",
    text: built.text,
    timestamp: new Date().toISOString(),
  });

  await saveConversation(conversation);

  const actions = conversation.state.awaitingContactData
    ? [...built.actions, { type: "ask_contact_data" as const, label: "Dejar mis datos" }]
    : built.actions;

  return {
    text: built.text,
    actions,
    areaDetected: service?.legal_area,
    serviceDetected: service?.id,
    leadCreated,
  };
}
