import { getStore } from "../store";
import type { Channel, Conversation, ChatMessage, UtmParams } from "../../types";

export function getOrCreateConversation(
  channel: Channel,
  externalId: string,
  utm?: UtmParams
): Promise<Conversation> {
  return getStore().getOrCreateConversation(channel, externalId, utm);
}

export function saveConversation(conversation: Conversation): Promise<void> {
  return getStore().saveConversation(conversation);
}

export function appendMessage(conversationId: string, message: ChatMessage): Promise<void> {
  return getStore().appendMessage(conversationId, message);
}
