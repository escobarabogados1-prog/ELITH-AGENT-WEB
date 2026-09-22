/**
 * Contrato del futuro sistema de conocimiento jurídico (RAG).
 *
 * Hoy no hay infraestructura vectorial: la función devuelve un arreglo vacío.
 * Cuando se incorpore una base de conocimiento (normativa, jurisprudencia,
 * documentos propios de ELITH IA LEGAL TECH), esta es la única función que
 * debe cambiar de implementación — ai/context-builder.ts ya la consume.
 */
export async function retrieve(
  query: string,
  area: string
): Promise<string[]> {
  void query;
  void area;
  return [];
}
