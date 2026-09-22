interface MessageBubbleProps {
  role: "user" | "assistant";
  text: string;
}

export function MessageBubble({ role, text }: MessageBubbleProps) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
          isUser
            ? "bg-gold-500 text-navy-900"
            : "bg-navy-600/80 text-white"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
