import { useState } from "react";
import { ArrowUp, Mic } from "lucide-react";

export default function AssistantComposer({ onSend, busy, mic }) {
  const [value, setValue] = useState("");

  function submit(event) {
    event.preventDefault();
    const text = value.trim();
    if (!text || busy) return;
    setValue("");
    onSend(text);
  }

  return (
    <form onSubmit={submit} className="mt-2 flex items-center gap-1.5">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={mic.listening ? "Listening…" : "Ask anything, or give me a task"}
        aria-label="Message the assistant"
        className="min-w-0 flex-1 rounded-xl border border-foreground/[0.09] bg-background/60 px-3 py-2 text-[11.5px] text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary/40"
      />
      {mic.supported ? (
        <button
          type="button"
          onClick={mic.toggle}
          aria-label={mic.listening ? "Stop listening" : "Speak to the assistant"}
          className={`rounded-xl border p-2 transition-colors ${
            mic.listening
              ? "border-primary/50 bg-primary/15 text-primary"
              : "border-foreground/[0.09] text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mic className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <button
        type="submit"
        disabled={busy || !value.trim()}
        aria-label="Send message"
        className="rounded-xl bg-primary p-2 text-primary-foreground active:opacity-90 disabled:opacity-40"
      >
        <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.4} />
      </button>
    </form>
  );
}