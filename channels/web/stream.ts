import type { OrchestratorReply } from "../../types";

// Marcador que separa el texto (transmitido palabra por palabra, para dar
// efecto de "escribiendo" en la UI) de los metadatos (acciones, área
// detectada, etc.) que van al final del stream.
export const ACTIONS_MARKER = "\u0000ELITHLEX_ACTIONS\u0000";

/**
 * Único lugar del proyecto que sabe cómo se transmite una respuesta al
 * navegador. El orquestador no sabe que esto existe.
 *
 * Nota de evolución: hoy transmite el texto ya completo, palabra por
 * palabra, para dar sensación de streaming en la UI. Cuando se quiera
 * streaming token a token real desde el modelo, este es el único archivo
 * que cambia (usando streamText de la AI SDK en vez de generateText).
 */
export function toWebStream(reply: OrchestratorReply): Response {
  const encoder = new TextEncoder();
  const words = reply.text.split(" ");

  const stream = new ReadableStream({
    async start(controller) {
      for (const word of words) {
        controller.enqueue(encoder.encode(word + " "));
        await new Promise((resolve) => setTimeout(resolve, 15));
      }

      const metadata = JSON.stringify({
        actions: reply.actions,
        areaDetected: reply.areaDetected,
        serviceDetected: reply.serviceDetected,
        leadCreated: reply.leadCreated,
      });
      controller.enqueue(encoder.encode(`${ACTIONS_MARKER}${metadata}`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
