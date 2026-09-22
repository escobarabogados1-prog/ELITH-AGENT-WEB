import type { ServiceDefinition } from "../catalog/schema";
import { retrieve } from "../knowledge/retriever";
import { BASE_SYSTEM_PROMPT } from "./system-prompt";

export interface ContextInput {
  service?: ServiceDefinition;
  currentQuestion?: string;
  answersSoFar?: Record<string, string>;
}

function costLine(label: string, cost: ServiceDefinition["professional_fee"]) {
  if (cost.amount === null) return `${label}: no definido — ${cost.note}`;
  return `${label}: $${cost.amount.toLocaleString("es-CO")} COP — ${cost.note}`;
}

/**
 * Construye el system prompt final para una llamada puntual al modelo.
 * Es el único lugar donde los datos "autorizados" (catálogo, respuestas
 * previas, y en el futuro resultados de knowledge/retriever) se convierten
 * en texto que el modelo puede leer, pero no modificar.
 */
export async function buildSystemPrompt(input: ContextInput): Promise<string> {
  const parts = [BASE_SYSTEM_PROMPT];

  if (input.service) {
    const s = input.service;
    // Punto de enchufe del futuro RAG: hoy retrieve() devuelve [] o datos fijos.
    const knowledge = await retrieve(s.service, s.legal_area);

    parts.push(
      [
        "CONTEXTO_COMERCIAL:",
        `Área: ${s.legal_area}`,
        `Servicio: ${s.service}`,
        `Descripción: ${s.description}`,
        `Documentos requeridos: ${s.required_documents.join(", ")}`,
        `Información del proceso: ${s.process_information.join(" | ")}`,
        costLine("Honorarios profesionales", s.professional_fee),
        costLine("Costos externos (notariales/judiciales)", s.external_cost),
        s.cost_note ? `Nota: ${s.cost_note}` : "",
        knowledge.length
          ? `Conocimiento adicional: ${knowledge.join(" | ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  if (input.currentQuestion) {
    parts.push(`PREGUNTA_ACTUAL:\n${input.currentQuestion}`);
  }

  return parts.join("\n\n");
}
