import { z } from "zod";

// El catálogo es la única fuente de verdad sobre servicios, requisitos y tarifas.
// El modelo de IA NUNCA genera estos datos: los lee de aquí.

export const CostSchema = z.object({
  // amount = null cuando el valor no está definido todavía o depende de un
  // tercero (notaría, autoridad, cuantía). Nunca se debe inventar un número.
  amount: z.number().nullable(),
  note: z.string(),
});

export const ServiceSchema = z.object({
  id: z.string(),
  legal_area: z.string(),
  service: z.string(),
  description: z.string(),
  // palabras clave para el clasificador determinista (core/classifier.ts)
  keywords: z.array(z.string()),
  qualification_questions: z.array(z.string()),
  required_documents: z.array(z.string()),
  process_information: z.array(z.string()),
  professional_fee: CostSchema,
  external_cost: CostSchema,
  cost_note: z.string().optional(),
  active: z.boolean(),
  cta: z.string(),
});

export type Cost = z.infer<typeof CostSchema>;
export type ServiceDefinition = z.infer<typeof ServiceSchema>;

export const CatalogSchema = z.array(ServiceSchema);
