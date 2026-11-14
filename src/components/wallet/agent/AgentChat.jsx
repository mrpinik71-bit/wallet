import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Plus, Settings2, Sparkles, Volume2, VolumeX } from "lucide-react";
import useAgentChat from "@/hooks/useAgentChat";
import AiProviderDialog from "@/components/wallet/ai/AiProviderDialog";
import AssistantBubble from "@/components/wallet/home/AssistantBubble";
import AssistantComposer from "@/components/wallet/home/AssistantComposer";

const HINTS = [
  "Plan my week",
  "Write a product caption",
  "Upload a plan to Notes/plan.md",
  "Open the swap screen",
];

/**
 * The agent chat itself — used by the full agent screen and by the dock that
 * follows the user on every page. Same device thread in both places.
 */
export default function AgentChat({ holdings, total, changePct, onRefresh, address, page = false }) {
  const [apiOpen, setApiOpen] = useState(false);
  const bottom = useRef(null);

  const { messages, busy, ask, clear, speech, done } = useAgentChat({
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
    <section className="flex flex-col rounded-2xl border border-foreground/[0.08] bg-card/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.9} />
          <h2 className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Helix agent
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => setApiOpen(true)}
            aria-label="Change the AI API key"
            className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary/15"
          >
            <Settings2 className="h-3 w-3" />
            API
          </button>
          <button
            type="button"
            onClick={() => speech.setVoiceOn((on) => !on)}
            aria-label={speech.voiceOn ? "Mute spoken replies" : "Unmute spoken replies"}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {speech.voiceOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
          {messages.length ? (
            <button
              type="button"
              onClick={clear}
              aria-label="Start a new chat"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {messages.length === 0 ? (
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
          Give me any task — writing, ideas, code, planning, or something in this wallet. I break it
          into steps and run them.
        </p>
      ) : (
        <div
          className={`mt-2 space-y-1.5 overflow-y-auto pr-0.5 ${
            page ? "max-h-[54vh] lg:max-h-[58vh]" : "max-h-[52vh]"
          }`}
        >
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