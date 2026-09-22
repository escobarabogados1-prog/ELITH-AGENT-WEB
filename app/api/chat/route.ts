import { z } from "zod";
import { processMessage } from "../../../core/orchestrator";
import { toWebStream } from "../../../channels/web/stream";

// Este archivo SOLO debe: recibir la petición, validar entrada,
// identificar la conversación, llamar al orquestador y adaptar la
// respuesta a streaming. No debe contener reglas comerciales ni jurídicas.

export const runtime = "nodejs";

const BodySchema = z.object({
  externalId: z.string().min(1),
  text: z.string().min(1).max(2000),
  utm: z
    .object({
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional(),
      utm_content: z.string().optional(),
      utm_term: z.string().optional(),
    })
    .optional(),
  contactData: z
    .object({
      name: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().optional(),
      city: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Entrada inválida" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const reply = await processMessage({
    channel: "web",
    conversationId: parsed.data.externalId,
    externalId: parsed.data.externalId,
    text: parsed.data.text,
    utm: parsed.data.utm,
    contactData: parsed.data.contactData,
  });

  return toWebStream(reply);
}
