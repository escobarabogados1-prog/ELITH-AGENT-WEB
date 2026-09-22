import { processMessage } from "../core/orchestrator";

async function run() {
  const externalId = "test-conversation-1";
  const turns = [
    "Mi esposo no quiere divorciarse.",
    "Sí, tenemos dos hijos menores.",
    "No, no hay ningún acuerdo todavía.",
    "Estamos en Colombia.",
  ];

  for (const text of turns) {
    const reply = await processMessage({
      channel: "web",
      conversationId: externalId,
      externalId,
      text,
    });
    console.log("\n> USUARIO:", text);
    console.log("< AGENTE :", reply.text);
    console.log("  área:", reply.areaDetected, "| servicio:", reply.serviceDetected);
    if (reply.actions.length) console.log("  acciones:", JSON.stringify(reply.actions));
  }

  // Turno final: entrega de datos de contacto para generar el lead.
  const finalReply = await processMessage({
    channel: "web",
    conversationId: externalId,
    externalId,
    text: "Aquí están mis datos.",
    contactData: { name: "Camila Ruiz", whatsapp: "3001234567" },
  });
  console.log("\n> USUARIO: (entrega datos de contacto)");
  console.log("< AGENTE :", finalReply.text);
  console.log("  leadCreated:", finalReply.leadCreated);
  console.log("  acciones:", JSON.stringify(finalReply.actions));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
