import { getStore } from "../store";
import type { AnalyticsEventType, Channel, UtmParams } from "../../types";

export function recordEvent(
  type: AnalyticsEventType,
  data: {
    conversationId?: string;
    channel?: Channel;
    metadata?: Record<string, unknown>;
    utm?: UtmParams;
  } = {}
): Promise<void> {
  return getStore().recordEvent(type, data);
}
