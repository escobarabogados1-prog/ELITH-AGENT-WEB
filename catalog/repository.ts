import rawServices from "./services.json";
import { CatalogSchema, type ServiceDefinition } from "./schema";

// Única función de este archivo: dar acceso de lectura al catálogo.
// Cuando el catálogo pase de services.json a PostgreSQL, SOLO este archivo
// cambia. core/, ai/ y rules/ nunca deben importar services.json directamente.

const catalog: ServiceDefinition[] = CatalogSchema.parse(rawServices);

export function getActiveServices(): ServiceDefinition[] {
  return catalog.filter((s) => s.active);
}

export function getServiceById(id: string): ServiceDefinition | undefined {
  return catalog.find((s) => s.id === id && s.active);
}

export function getServicesByArea(area: string): ServiceDefinition[] {
  return getActiveServices().filter(
    (s) => s.legal_area.toLowerCase() === area.toLowerCase()
  );
}

export function getAllAreas(): string[] {
  return Array.from(new Set(getActiveServices().map((s) => s.legal_area)));
}
