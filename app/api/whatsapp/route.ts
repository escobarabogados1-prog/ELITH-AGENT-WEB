// Deshabilitado a propósito en el MVP. Ver channels/whatsapp/adapter.ts.
// Cuando se active la integración oficial con WhatsApp Business Cloud API,
// este archivo pasa a verificar el webhook de Meta y a llamar
// core/orchestrator.processMessage con channel: "whatsapp".

export const runtime = "nodejs";

export async function POST() {
  return Response.json(
    { error: "Canal de WhatsApp no habilitado todavía en este MVP." },
    { status: 501 }
  );
}

export async function GET() {
  return Response.json(
    { error: "Canal de WhatsApp no habilitado todavía en este MVP." },
    { status: 501 }
  );
}
