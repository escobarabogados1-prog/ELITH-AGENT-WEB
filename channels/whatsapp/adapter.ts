// ADAPTADOR DESHABILITADO EN EL MVP.
//
// No implementa WhatsApp Web automation, ni scraping, ni ningún mecanismo
// no oficial. Cuando se integre WhatsApp Business Cloud API (oficial), este
// archivo pasa a:
//
//   1. Verificar la firma/reto del webhook de Meta.
//   2. Extraer {externalId: wa_id, text} del payload del webhook.
//   3. Llamar a core/orchestrator.processMessage({ channel: "whatsapp", ... }).
//   4. Enviar la respuesta usando la API oficial de envío de mensajes de
//      WhatsApp Business Cloud API (nunca WhatsApp Web).
//
// Ningún otro archivo del proyecto debe implementar lógica de WhatsApp
// distinta a la que pase por aquí y por core/orchestrator.ts.

import type { ProcessMessageInput } from "../../core/orchestrator";

export function isWhatsappChannelEnabled(): boolean {
  return false;
}

export type WhatsappWebhookPayload = unknown;

/**
 * Placeholder intencional. Lanza si se invoca, para que quede explícito que
 * el canal no está activo todavía y no se llegue a producción por error.
 */
export async function handleWhatsappWebhook(
  _payload: WhatsappWebhookPayload
): Promise<ProcessMessageInput | null> {
  throw new Error(
    "Canal de WhatsApp deshabilitado en el MVP. Ver channels/whatsapp/adapter.ts."
  );
}
