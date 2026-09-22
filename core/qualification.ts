import type { ServiceDefinition } from "../catalog/schema";
import { getQualificationSteps, type QualificationStep } from "../rules";
import type { ConversationState } from "../types";

export interface QualificationResult {
  done: boolean;
  nextQuestion?: string;
  updatedAnswers: Record<string, string>;
  nextIndex: number;
}

function applicableSteps(
  steps: QualificationStep[],
  answers: Record<string, string>
): QualificationStep[] {
  return steps.filter((s) => !s.appliesIf || s.appliesIf(answers));
}

/**
 * Recibe el estado actual de la conversación y, si venía respondiendo una
 * pregunta de precalificación, registra la respuesta y calcula la siguiente.
 * No decide nada de negocio por su cuenta: solo recorre los pasos que
 * /rules ya definió para el servicio.
 */
export function advanceQualification(
  service: ServiceDefinition,
  state: ConversationState,
  userAnswerText: string | null
): QualificationResult {
  const steps = getQualificationSteps(service);
  const answers = { ...state.qualificationAnswers };

  if (userAnswerText !== null) {
    const applicable = applicableSteps(steps, answers);
    const currentStep = applicable[state.qualificationIndex];
    if (currentStep) {
      answers[currentStep.key] = userAnswerText;
    }
  }

  const applicableAfter = applicableSteps(steps, answers);
  const nextIndex = state.qualificationIndex + (userAnswerText !== null ? 1 : 0);
  const nextStep = applicableAfter[nextIndex];

  return {
    done: !nextStep,
    nextQuestion: nextStep?.question,
    updatedAnswers: answers,
    nextIndex,
  };
}

export function firstQuestion(service: ServiceDefinition): string | undefined {
  return getQualificationSteps(service)[0]?.question;
}
