import { useRef, useState } from "react";
import { ArrowUp, Mic, Paperclip, X } from "lucide-react";

// Text formats the agent can read on this device and hand back edited.
const READABLE = /\.(txt|md|csv|json|html|log|js|ts|css|py|yml|yaml)$/i;

export default function AssistantComposer({ onSend, busy, mic }) {
  const [value, setValue] = useState("");
  const [file, setFile] = useState(null);
  const picker = useRef(null);

  function submit(event) {
    event.preventDefault();
    const text = value.trim();
    if ((!text && !file) || busy) return;
    const attached = file;
    setValue("");
    setFile(null);
    onSend(text || `Rewrite this file: ${attached.name}`, attached);
  }

  async function pick(event) {
    const chosen = event.target.files?.[0];
    event.target.value = "";
    if (!chosen) return;
    const text = await chosen.text();
    setFile({ name: chosen.name, text: String(text).slice(0, 12000) });
  }

  return (
    <form onSubmit={submit} className="mt-2">
      {file ? (
        <div className="mb-1.5 flex items-center gap-1.5 rounded-xl border border-foreground/[0.09] bg-background/60 px-2.5 py-1.5">
          <Paperclip className="h-3 w-3 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-[10.5px] text-muted-foreground">{file.name}</span>
          <button
            type="button"
            onClick={() => setFile(null)}
            aria-label="Remove the attached file"
            className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => picker.current?.click()}
          aria-label="Attach a file for the agent to read"
          className="rounded-xl border border-foreground/[0.09] p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Paperclip className="h-3.5 w-3.5" />
        </button>
        <input ref={picker} type="file" accept=".txt,.md,.csv,.json,.html,.log,.js,.ts,.css,.py,.yml,.yaml" onChange={pick} className="hidden" />
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
          disabled={busy || (!value.trim() && !file)}
          aria-label="Send message"
          className="rounded-xl bg-primary p-2 text-primary-foreground active:opacity-90 disabled:opacity-40"
        >
          <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
      </div>
    </form>
  );
}