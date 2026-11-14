import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Plus, Settings2, Sparkles, Volume2, VolumeX } from "lucide-react";
import usePortfolio from "@/hooks/usePortfolio";
import useAgentChat from "@/hooks/useAgentChat";
import AiProviderDialog from "@/components/wallet/ai/AiProviderDialog";
import AssistantBubble from "@/components/wallet/home/AssistantBubble";
import AssistantComposer from "@/components/wallet/home/AssistantComposer";

const HINTS = ["Plan my week", "Write a product caption", "Explain a smart contract", "Open the swap screen"];

export default function AgentScreen() {
  const { holdings, total, changePct, addresses, refresh } = usePortfolio();
  const [apiOpen, setApiOpen] = useState(false);
  const bottom = useRef(null);

  const { messages, busy, ask, clear, speech, done } = useAgentChat({
    holdings,
    total,
    changePct,
    onRefresh: refresh,
    address: addresses.tron,
  });

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy]);

  return (
    <div className="mx-auto w-full max-w-[520px] lg:max-w-[720px]">
      <section className="lux noise overflow-hidden p-4 lg:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-[20px] leading-none">Helix agent</h1>
              <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Any task · any topic
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setApiOpen(true)}
              aria-label="Change the AI API key"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => speech.setVoiceOn((on) => !on)}
              aria-label={speech.voiceOn ? "Mute spoken replies" : "Unmute spoken replies"}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {speech.voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            {messages.length ? (
              <button
                type="button"
                onClick={clear}
                aria-label="Start a new chat"
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="hairline my-3" />

        {messages.length === 0 ? (
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            Give me any task — writing, ideas, code, planning, translation, or something inside this
            wallet. I break it into steps and run them.
          </p>
        ) : (
          <div className="max-h-[54vh] space-y-2 overflow-y-auto pr-1">
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
          <p className="mt-2 flex items-center gap-1.5 text-[10.5px] font-medium text-primary">
            <Check className="h-3 w-3" strokeWidth={2.4} />
            {done}
          </p>
        ) : null}

        {messages.length === 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {HINTS.map((hint) => (
              <button
                key={hint}
                type="button"
                onClick={() => ask(hint)}
                className="rounded-full border border-foreground/[0.09] px-2.5 py-1 text-[10.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {hint}
              </button>
            ))}
          </div>
        ) : null}

        <AssistantComposer onSend={ask} busy={busy} mic={speech} />
      </section>

      <p className="mt-4 text-center text-[8.5px] font-medium uppercase tracking-[0.24em] text-muted-foreground/40">
        Your key and phrase never leave this device
      </p>

      <AiProviderDialog open={apiOpen} onOpenChange={setApiOpen} />
    </div>
  );
}