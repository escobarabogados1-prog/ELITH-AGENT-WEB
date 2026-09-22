"use client";

interface AreaCardProps {
  area: string;
  onSelect: (area: string) => void;
}

export function AreaCard({ area, onSelect }: AreaCardProps) {
  return (
    <button
      onClick={() => onSelect(area)}
      className="rounded-xl border border-gold-500/30 bg-navy-600/60 px-4 py-3 text-left text-sm font-medium text-white transition hover:border-gold-400 hover:bg-navy-400"
    >
      {area}
    </button>
  );
}
