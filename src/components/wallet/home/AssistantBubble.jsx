export default function AssistantBubble({ role, text, faded = false }) {
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[86%] whitespace-pre-line rounded-2xl px-3 py-2 text-[11.5px] leading-relaxed ${
          mine
            ? "bg-primary/15 text-foreground"
            : "border border-foreground/[0.08] bg-foreground/[0.03] text-foreground/90"
        } ${faded ? "animate-pulse text-muted-foreground" : ""}`}
      >
        {text}
      </p>
    </div>
  );
}