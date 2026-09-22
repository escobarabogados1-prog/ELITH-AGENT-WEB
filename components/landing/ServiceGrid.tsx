"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AreaCard } from "./AreaCard";

interface ServiceGridProps {
  areas: string[];
}

export function ServiceGrid({ areas }: ServiceGridProps) {
  const router = useRouter();
  const [text, setText] = useState("");

  function goToChat(initialText: string) {
    const params = new URLSearchParams(window.location.search);
    if (initialText) params.set("msg", initialText);
    router.push(`/chat?${params.toString()}`);
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-xl px-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {areas.map((area) => (
          <AreaCard key={area} area={area} onSelect={(a) => goToChat(`Necesito ayuda con ${a}`)} />
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) goToChat(text.trim());
        }}
        className="mt-6 flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cuéntanos brevemente qué necesitas resolver..."
          className="flex-1 rounded-full border border-navy-100/20 bg-navy-700 px-5 py-3 text-white placeholder:text-navy-100/50 focus:border-gold-400 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-gold-500 px-6 py-3 font-medium text-navy-900 transition hover:bg-gold-400"
        >
          Comenzar consulta
        </button>
      </form>
    </div>
  );
}
