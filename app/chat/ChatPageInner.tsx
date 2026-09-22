"use client";

import { useSearchParams } from "next/navigation";
import { ChatWindow } from "../../components/chat/ChatWindow";
import { readUtmFromSearchParams } from "../../lib/utm";

export function ChatPageInner() {
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get("msg") || undefined;
  const utm = readUtmFromSearchParams(searchParams);

  return <ChatWindow initialMessage={initialMessage} utm={utm} />;
}
