import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Sparkles, Volume2, VolumeX } from "lucide-react";
import { askAssistant } from "@/lib/assistant-fns";
import useSpeech from "@/hooks/useSpeech";
import AssistantBubble from "@/components/wallet/home/AssistantBubble";
import AssistantComposer from "@/components/wallet/home/AssistantComposer";

const HINTS = ["What's my biggest holding?", "How is my portfolio today?", "Refresh my balances"];

const SCREENS = { send: "/send", receive: "/receive", swap: "/swap", markets: "/markets", activity: "/activity" };

export default function AssistantCard({ holdings, total, changePct, onRefresh, address }) {
  const call = useServerFn(askAssistant);
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [did, setDid] = useState("");
  const askRef = useRef(null);
  const bottom = useRef(null);

  // The small tasks the assistant may carry out for the user.
  async function perform(action, label) {
    if (!action || action === "none") return;
    if (action === "refresh") {
      await onRefresh?.();
      setDid(label || "Balances refreshed");
      return;
    }
    if (action === "copy_address") {
      try {
        await navigator.clipboard.writeText(address || "");
        setDid(label || "Address copied");
      } catch {
        setDid("This browser blocked the clipboard — copy it from Receive");
      }
      return;
    }
    if (SCREENS[action]) {
      navigate({ to: SCREENS[action] });
      setDid(label || `Opened ${action}`);
    }
  }

  const speech = useSpeech({ onFinal: (text) => askRef.current?.(text) });

  // Only the balances already on screen are sent along as context.
  const snapshot = useMemo(
    () => ({
      total: Number(total) || 0,
      changePct: Number(changePct) || 0,
      holdings: holdings
        .filter((item) => item.value > 0)
        .slice(0, 12)
        .map((item) => ({
          symbol: item.symbol,
          name: item.name,
          chain: item.chain,
          balance: Number(item.balance) || 0,
          value: Number(item.value) || 0,
        })),
    }),
    [holdings, total, changePct],
  );

  const ask = useCallback(
    async (raw) => {
      const question = String(raw || "").trim();
      if (!question || busy) return;
      const next = [...messages, { role: "user", text: question }];
      setMessages(next);
      setDid("");
      setBusy(true);
      try {
        const { answer, action, actionLabel } = await call({ data: { context: snapshot, history: next.slice(-10) } });
        setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
        speech.speak(answer);
        await perform(action, actionLabel);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "I couldn't answer just now — please try again." },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, snapshot, call, speech],
  );

  useEffect(() => {
    askRef.current = ask;
  }, [ask]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy]);

  return (
    <section className="mt-3 rounded-2xl border border-foreground/[0.08] bg-card/60 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.9} />
          <h2 className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">Helix assistant</h2>
        </div>
        <button
          type="button"
          onClick={() => speech.setVoiceOn((on) => !on)}
          aria-label={speech.voiceOn ? "Mute spoken replies" : "Unmute spoken replies"}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          {speech.voiceOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        </button>
      </div>

      {messages.length === 0 ? (
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
          Ask about your portfolio, a chain or how a screen works — type or tap the mic.
        </p>
      ) : (
        <div className="mt-2 max-h-60 space-y-1.5 overflow-y-auto pr-0.5">
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

      {did ? (
        <p className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-primary">
          <Check className="h-3 w-3" strokeWidth={2.4} />
          {did}
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
    </section>
  );
}