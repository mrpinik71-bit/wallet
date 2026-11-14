import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Loader2, Maximize2, Settings2, Sparkles, Volume2, VolumeX } from "lucide-react";
import useAgentChat from "@/hooks/useAgentChat";
import AiProviderDialog from "@/components/wallet/ai/AiProviderDialog";
import AssistantBubble from "@/components/wallet/home/AssistantBubble";
import AssistantComposer from "@/components/wallet/home/AssistantComposer";

const HINTS = ["What can you do?", "Write a short tweet for me", "Open the swap screen"];

export default function AssistantCard({ holdings, total, changePct, onRefresh, address }) {
  const [apiOpen, setApiOpen] = useState(false);
  const bottom = useRef(null);

  // The same thread as the full agent screen, so a task started here continues there.
  const { messages, busy, ask, speech, done } = useAgentChat({
    holdings,
    total,
    changePct,
    onRefresh,
    address,
  });

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy]);

  return (
    <section className="mt-3 rounded-2xl border border-foreground/[0.08] bg-card/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.9} />
          <h2 className="truncate text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Helix agent
          </h2>
          <button
            type="button"
            onClick={() => setApiOpen(true)}
            aria-label="Change the AI API key"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary/15"
          >
            <Settings2 className="h-3 w-3" />
            Change API
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Link
            to="/assistant"
            aria-label="Open the full agent screen"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => speech.setVoiceOn((on) => !on)}
            aria-label={speech.voiceOn ? "Mute spoken replies" : "Unmute spoken replies"}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {speech.voiceOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {messages.length === 0 ? (
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
          Give me any task — writing, ideas, code, or something in the wallet. I break it into steps
          and run them.
        </p>
      ) : (
        <div className="mt-2 max-h-60 space-y-1.5 overflow-y-auto pr-0.5">
          {messages.map((message, index) => (
            <AssistantBubble key={index} role={message.role} text={message.text} />
          ))}
          {busy ? (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Working…
            </div>
          ) : null}
          <div ref={bottom} />
        </div>
      )}

      {done ? (
        <p className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-primary">
          <Check className="h-3 w-3" strokeWidth={2.4} />
          {done}
        </p>
      ) : null}

      {messages.length === 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {HINTS.map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => ask(hint)}
              className="rounded-full border border-foreground/[0.09] px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {hint}
            </button>
          ))}
        </div>
      ) : null}

      <AssistantComposer onSend={ask} busy={busy} mic={speech} />

      <AiProviderDialog open={apiOpen} onOpenChange={setApiOpen} />
    </section>
  );
}