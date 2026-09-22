import { generateText } from "ai";

// AI_MODEL: verificado y disponible hoy en Vercel AI Gateway.
// No cambiar este identificador sin confirmar en https://vercel.com/ai-gateway
// que sigue existiendo — nunca se debe suponer un nombre de modelo.
const AI_MODEL = process.env.AI_MODEL || "anthropic/claude-sonnet-5";

export interface GenerateReplyInput {
  systemPrompt: string;
  userText: string;
}

/**
 * Llama al modelo únicamente para INTERPRETAR y REDACTAR lenguaje natural.
 * El systemPrompt ya debe traer inyectados los datos autorizados (catálogo,
 * reglas, respuestas previas). El modelo nunca decide tarifas ni requisitos:
 * solo los repite/explica con los datos que se le entregan.
 *
 * Si no hay AI_GATEWAY_API_KEY configurada (por ejemplo en desarrollo local
 * antes de crear la key), se usa una respuesta de plantilla para que el flujo
 * completo se pueda probar sin depender de la API.
 */
export async function generateReply(
  input: GenerateReplyInput
): Promise<string> {
  if (!process.env.AI_GATEWAY_API_KEY) {
    return templatedFallback(input);
  }

  try {
    const result = await generateText({
      model: AI_MODEL,
      system: input.systemPrompt,
      prompt: input.userText,
      maxOutputTokens: 400,
    });
    return result.text.trim();
  } catch (error) {
    console.error("[ai/provider] fallo llamando al modelo:", error);
    return templatedFallback(input);
  }
}

// Fallback determinista: no inventa nada, solo confirma que el mensaje
// llegó y repite la última instrucción del prompt (que ya trae los datos
// reales inyectados por response-builder). Sirve para desarrollo sin costo.
function templatedFallback(input: GenerateReplyInput): string {
  const marker = "PREGUNTA_ACTUAL:\n";
  const markerIndex = input.systemPrompt.indexOf(marker);
  if (markerIndex === -1) {
    return "Gracias por tu mensaje. Cuéntame un poco más sobre tu situación para poder orientarte.";
  }
  const from = markerIndex + marker.length;
  const to = input.systemPrompt.indexOf("\n", from);
  const question = (to === -1 ? input.systemPrompt.slice(from) : input.systemPrompt.slice(from, to)).trim();
  return question || "Cuéntame un poco más sobre tu situación.";
}
