"use client";

import { useEffect, useRef, useState } from "react";
import { getOrCreateWebExternalId } from "../../channels/web/session";
import { ACTIONS_MARKER } from "../../channels/web/stream";
import type { OrchestratorAction, UtmParams } from "../../types";
import { MessageBubble } from "./MessageBubble";
import { WhatsAppButton } from "../shared/WhatsAppButton";

interface ChatWindowProps {
  initialMessage?: string;
  utm?: UtmParams;
}

interface DisplayMessage {
  role: "user" | "assistant";
  text: string;
}

interface ReplyMetadata {
  actions: OrchestratorAction[];
  areaDetected?: string;
  serviceDetected?: string;
  leadCreated?: boolean;
}

export function ChatWindow({ initialMessage, utm }: ChatWindowProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [actions, setActions] = useState<OrchestratorAction[]>([]);
  const [contactForm, setContactForm] = useState({ name: "", whatsapp: "" });
  const externalIdRef = useRef<string>("");
  const sentInitial = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    externalIdRef.current = getOrCreateWebExternalId();
  }, []);

  useEffect(() => {
    if (initialMessage && !sentInitial.current) {
      sentInitial.current = true;
      void send(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(
    text: string,
    contactData?: { name?: string; whatsapp?: string }
  ) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);
    setActions([]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        externalId: externalIdRef.current,
        text,
        utm,
        contactData,
      }),
    });

    if (!res.body) {
      setSending(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });

      const markerIndex = full.indexOf(ACTIONS_MARKER);
      const visibleText = markerIndex === -1 ? full : full.slice(0, markerIndex);

      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", text: visibleText.trim() };
        return copy;
      });
    }

    const markerIndex = full.indexOf(ACTIONS_MARKER);
    if (markerIndex !== -1) {
      try {
        const metadata: ReplyMetadata = JSON.parse(
          full.slice(markerIndex + ACTIONS_MARKER.length)
        );
        setActions(metadata.actions || []);
      } catch {
        // Si el parseo falla, simplemente no mostramos acciones extra.
      }
    }

    setSending(false);
  }

  const needsContactData = actions.some((a) => a.type === "ask_contact_data");
  const whatsappAction = actions.find((a) => a.type === "whatsapp_cta");

  return (
    <div className="mx-auto flex h-screen w-full max-w-2xl flex-col bg-navy-900">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6">
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} text={m.text} />
        ))}
        <div ref={bottomRef} />
      </div>

      {whatsappAction && (
        <div className="flex justify-center px-4 pb-2">
          <WhatsAppButton
            message={(whatsappAction.payload?.message as string) || undefined}
          />
        </div>
      )}

      {needsContactData && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send("Aquí están mis datos de contacto.", contactForm);
          }}
          className="flex flex-col gap-2 border-t border-navy-100/10 px-4 py-3 sm:flex-row"
        >
          <input
            placeholder="Tu nombre"
            value={contactForm.name}
            onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
            className="flex-1 rounded-full border border-navy-100/20 bg-navy-700 px-4 py-2 text-sm text-white placeholder:text-navy-100/50"
          />
          <input
            placeholder="Tu WhatsApp"
            value={contactForm.whatsapp}
            onChange={(e) =>
              setContactForm((f) => ({ ...f, whatsapp: e.target.value }))
            }
            className="flex-1 rounded-full border border-navy-100/20 bg-navy-700 px-4 py-2 text-sm text-white placeholder:text-navy-100/50"
          />
          <button
            type="submit"
            className="rounded-full bg-gold-500 px-5 py-2 text-sm font-medium text-navy-900"
          >
            Enviar
          </button>
        </form>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex gap-2 border-t border-navy-100/10 px-4 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          disabled={sending}
          className="flex-1 rounded-full border border-navy-100/20 bg-navy-700 px-4 py-2 text-sm text-white placeholder:text-navy-100/50 focus:border-gold-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-full bg-gold-500 px-5 py-2 text-sm font-medium text-navy-900 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
