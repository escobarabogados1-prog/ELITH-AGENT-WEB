// Este archivo SÍ puede usar APIs de navegador (se ejecuta en el cliente).
// Es el único lugar donde se decide cómo se identifica una conversación web.
//
// Importante: no usamos la cookie de sesión como identidad de la persona.
// external_id es solo el identificador de ESTA conversación en ESTE
// navegador; la identidad real del contacto se construye después, cuando
// el usuario da su nombre/WhatsApp durante el chat.

const STORAGE_KEY = "elithlex_conversation_external_id";

export function getOrCreateWebExternalId(): string {
  if (typeof window === "undefined") return "server";

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, id);
  return id;
}
