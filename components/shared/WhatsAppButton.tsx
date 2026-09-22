"use client";

interface WhatsAppButtonProps {
  message?: string;
  label?: string;
  onClick?: () => void;
  className?: string;
}

export function WhatsAppButton({
  message,
  label = "Hablar con un abogado",
  onClick,
  className = "",
}: WhatsAppButtonProps) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573167824217";
  const text = message || "Hola, quisiera más información sobre sus servicios jurídicos.";
  const href = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-gold-500 px-6 py-3 font-medium text-navy-900 transition hover:bg-gold-400 ${className}`}
    >
      {label}
    </a>
  );
}
