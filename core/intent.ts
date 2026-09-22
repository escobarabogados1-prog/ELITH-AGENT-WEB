import type { Intent } from "../types";

const URGENCY_WORDS = ["urgente", "hoy", "ya mismo", "lo antes posible", "emergencia"];
const HIRE_WORDS = ["contratar", "quiero contratarlos", "cómo empezamos", "quiero avanzar"];
const QUOTE_WORDS = ["cuánto cuesta", "cuánto vale", "precio", "tarifa", "honorarios", "cotización"];

/**
 * Clasificador simple por palabras clave. Deliberadamente determinista:
 * la intención comercial no depende de que el modelo "adivine" algo.
 */
export function detectIntent(text: string): Intent {
  const normalized = text.toLowerCase();

  if (URGENCY_WORDS.some((w) => normalized.includes(w))) return "urgencia";
  if (HIRE_WORDS.some((w) => normalized.includes(w))) return "contratacion";
  if (QUOTE_WORDS.some((w) => normalized.includes(w))) return "cotizacion";
  return "informacion";
}
