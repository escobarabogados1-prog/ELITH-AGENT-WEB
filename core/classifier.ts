import { getActiveServices } from "../catalog/repository";
import type { ServiceDefinition } from "../catalog/schema";

/**
 * Primer intento de clasificación: coincidencia de palabras clave contra el
 * catálogo. Es barato, determinista y no depende del modelo de IA.
 * Si no hay coincidencia, el orquestador puede optar por seguir en modo
 * informativo general hasta que el usuario dé más detalles.
 */
export function classifyService(text: string): ServiceDefinition | undefined {
  const normalized = text.toLowerCase();
  const services = getActiveServices();

  let best: { service: ServiceDefinition; score: number } | undefined;

  for (const service of services) {
    const score = service.keywords.reduce(
      (acc, keyword) => (normalized.includes(keyword.toLowerCase()) ? acc + 1 : acc),
      0
    );
    if (score > 0 && (!best || score > best.score)) {
      best = { service, score };
    }
  }

  return best?.service;
}
