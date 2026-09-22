import type { ServiceDefinition } from "../catalog/schema";

// Las reglas viven aquí como estructuras de datos, no como texto suelto
// dentro de un prompt. El orquestador las consulta; el modelo de IA no las
// decide ni las inventa.

export interface QualificationStep {
  key: string;
  question: string;
  // condición opcional: si devuelve false, el paso se omite según respuestas previas
  appliesIf?: (answers: Record<string, string>) => boolean;
}

// Overrides explícitos por servicio, cuando el orden o las condiciones
// importan más que la lista plana del catálogo. Ejemplo: divorcio unilateral.
const OVERRIDES: Record<string, QualificationStep[]> = {
  divorcio_unilateral: [
    { key: "hijos_menores", question: "¿Hay hijos menores de edad?" },
    {
      key: "acuerdo_conyuges",
      question:
        "¿Existe algún acuerdo entre los cónyuges sobre alimentos, custodia o bienes?",
    },
    {
      key: "ubicacion",
      question: "¿Están en Colombia o en el exterior?",
    },
  ],
};

// Regla por defecto: cada pregunta del catálogo se convierte en un paso lineal.
function fromCatalog(service: ServiceDefinition): QualificationStep[] {
  return service.qualification_questions.map((question, index) => ({
    key: `${service.id}_q${index}`,
    question,
  }));
}

export function getQualificationSteps(
  service: ServiceDefinition
): QualificationStep[] {
  return OVERRIDES[service.id] ?? fromCatalog(service);
}
