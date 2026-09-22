import type { ServiceDefinition } from "../catalog/schema";
import type { ConversationState, Intent } from "../types";

export interface LeadDecision {
  hasCommercialIntent: boolean;
  needsContactData: boolean;
  urgency: "baja" | "media" | "alta";
  summary: string;
}

/**
 * Decide si, dado el estado actual, corresponde ofrecer "hablar con un
 * abogado" y capturar datos de contacto. Es lógica pura: no escribe en base
 * de datos ni conoce el canal. El orquestador usa este resultado para
 * decidir sus siguientes pasos.
 */
export function evaluateLeadOpportunity(
  service: ServiceDefinition | undefined,
  state: ConversationState,
  intent: Intent,
  hasContactData: boolean
): LeadDecision {
  const qualificationSignal = state.qualificationDone;
  const intentSignal = intent === "cotizacion" || intent === "contratacion" || intent === "urgencia";
  const hasCommercialIntent = Boolean(service) && (qualificationSignal || intentSignal);

  const urgency: LeadDecision["urgency"] = intent === "urgencia" ? "alta" : qualificationSignal ? "media" : "baja";

  const summary = service
    ? `Consulta sobre ${service.service} (${service.legal_area}). Respuestas: ${JSON.stringify(
        state.qualificationAnswers
      )}`
    : "Consulta general sin área jurídica identificada todavía.";

  return {
    hasCommercialIntent,
    needsContactData: hasCommercialIntent && !hasContactData,
    urgency,
    summary,
  };
}
