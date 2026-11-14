import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Volume2, VolumeX } from "lucide-react";
import { askAssistant } from "@/lib/assistant-fns";
import { askWithOwnProvider } from "@/lib/ask-assistant";
import useSpeech from "@/hooks/useSpeech";
import AssistantBubble from "@/components/wallet/home/AssistantBubble";
import AssistantComposer from "@/components/wallet/home/AssistantComposer";

// The app opens on the vault screen, before any balance is known, so the
// assistant is asked without a portfolio — it can still explain everything.
const EMPTY = { total: 0, changePct: 0, holdings: [] };
const HINTS = ["What is Helix?", "Is my phrase safe?", "How do I restore a wallet?"];

export default function EntryAssistant() {
  const call = useServerFn(askAssistant);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const askRef = useRef(null);
  const bottom = useRef(null);
  const speech = useSpeech({ onFinal: (text) => askRef.current?.(text) });

  const ask = useCallback(
    async (raw) => {
      const question = String(raw || "").trim();
      if (!question || busy) return;
      const next = [...messages, { role: "user", text: question }];
      setMessages(next);
      setBusy(true);
      try {
        const payload = { context: EMPTY, history: next.slice(-10) };
        const own = await askWithOwnProvider(payload);
        const { answer } = own || (await call({ data: payload }));
        setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
        speech.speak(answer);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "I couldn't answer just now — please try again." },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, call, speech],
  );

  useEffect(() => {
    askRef.current = ask;
  }, [ask]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy]);

  return (
    <section className="rounded-2xl border border-foreground/[0.08] bg-card/60 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.9} />
          <h2 className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Helix assistant
          </h2>
        </div>
        {speech.supported ? (
          <button
            type="button"
            onClick={() => speech.setVoiceOn((on) => !on)}
            aria-label={speech.voiceOn ? "Mute spoken replies" : "Unmute spoken replies"}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {speech.voiceOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
        ) : null}
      </div>

      {messages.length === 0 ? (
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
          Ask me anything before you unlock — the vault, your recovery phrase, or how a screen works.
        </p>
      ) : (
        <div className="mt-2 max-h-52 space-y-1.5 overflow-y-auto pr-0.5">
          {messages.map((message, index) => (
            <AssistantBubble key={index} role={message.role} text={message.text} />
          ))}
          {busy ? (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Thinking…
            </div>
          ) : null}
          <div ref={bottom} />
        </div>
      )}

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
    </section>
  );
}