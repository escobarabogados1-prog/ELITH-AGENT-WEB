import { z } from "zod";
import { upsertContact } from "../../../persistence/repositories/contacts";
import { createLead } from "../../../persistence/repositories/leads";
import { recordEvent } from "../../../persistence/repositories/analytics";

export const runtime = "nodejs";

const BodySchema = z.object({
  name: z.string().min(1),
  whatsapp: z.string().min(7),
  email: z.string().email().optional(),
  city: z.string().optional(),
  legalArea: z.string().optional(),
  summary: z.string().min(1),
  utm: z
    .object({
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional(),
      utm_content: z.string().optional(),
      utm_term: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { name, whatsapp, email, city, legalArea, summary, utm } = parsed.data;

  const contact = await upsertContact({ name, whatsapp, email, city });
  const lead = await createLead({
    contactId: contact.id,
    legalArea,
    summary,
    sourceChannel: "web",
    utm,
    status: "nuevo",
  });

  await recordEvent("lead_created", {
    channel: "web",
    metadata: { leadId: lead.id, source: "landing_form" },
    utm,
  });

  return Response.json({ ok: true, leadId: lead.id });
}
