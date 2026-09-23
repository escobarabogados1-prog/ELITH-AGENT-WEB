import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const AI_MODEL = process.env.AI_MODEL || "openrouter/free";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export interface GenerateReplyInput {
  systemPrompt: string;
  userText: string;
}

export async function generateReply(
  input: GenerateReplyInput
): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    return templatedFallback(input);
  }

  try {
    const result = await generateText({
      model: openrouter(AI_MODEL),
      system: input.systemPrompt,
      prompt: input.userText,
      maxOutputTokens: 400,
    });

    return result.text.trim();
  } catch (error) {
    console.error("[ai/provider] fallo llamando al modelo:", error);
    return templatedFallback(input);
  }
}

function templatedFallback(input: GenerateReplyInput): string {
  const marker = "PREGUNTA_ACTUAL:\n";
  const markerIndex = input.systemPrompt.indexOf(marker);

  if (markerIndex === -1) {
    return "Gracias por tu mensaje. Cuéntame un poco más sobre tu situación para poder orientarte.";
  }

  const from = markerIndex + marker.length;
  const to = input.systemPrompt.indexOf("\n", from);

  const question = (
    to === -1
      ? input.systemPrompt.slice(from)
      : input.systemPrompt.slice(from, to)
  ).trim();

  return question || "Cuéntame un poco más sobre tu situación.";
}