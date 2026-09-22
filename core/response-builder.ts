import { buildSystemPrompt } from "../ai/context-builder";
import { generateReply } from "../ai/provider";
import type { ServiceDefinition } from "../catalog/schema";
import type { OrchestratorAction } from "../types";

export interface BuildReplyInput {
  userText: string;
  service?: ServiceDefinition;
  nextQuestion?: string;
  answersSoFar?: Record<string, string>;
  offerWhatsapp?: boolean;
  contactName?: string;
}

export interface BuiltReply {
  text: string;
  actions: OrchestratorAction[];
}

function buildWhatsappMessage(name: string | undefined, service?: ServiceDefinition): string {
  const who = name ? `Hola, soy ${name}.` : "Hola.";
  const about = service ? ` Consulté sobre ${service.service} en ELITH IA LEGAL TECH` : " Consulté en ELITH IA LEGAL TECH";
  return `${who}${about} y quisiera hablar con un abogado.`;
}

export async function buildReply(input: BuildReplyInput): Promise<BuiltReply> {
  const systemPrompt = await buildSystemPrompt({
    service: input.service,
    currentQuestion: input.nextQuestion,
    answersSoFar: input.answersSoFar,
  });

  const text = await generateReply({ systemPrompt, userText: input.userText });

  const actions: OrchestratorAction[] = [];
  if (input.offerWhatsapp) {
    actions.push({
      type: "whatsapp_cta",
      label: "Hablar con un abogado",
      payload: {
        message: buildWhatsappMessage(input.contactName, input.service),
      },
    });
  }

  return { text, actions };
}
