import { getStore } from "../store";
import type { Lead } from "../../types";

export function createLead(lead: Omit<Lead, "id" | "createdAt">): Promise<Lead> {
  return getStore().createLead(lead);
}
