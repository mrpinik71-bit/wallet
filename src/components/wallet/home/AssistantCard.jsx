import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Settings2, Sparkles, Volume2, VolumeX } from "lucide-react";
import { askAssistant } from "@/lib/assistant-fns";
import { askWithOwnProvider } from "@/lib/ask-assistant";
import useSpeech from "@/hooks/useSpeech";
import useAssistantActions from "@/hooks/useAssistantActions";
import { useWallet } from "@/lib/WalletContext";
import AssistantBubble from "@/components/wallet/home/AssistantBubble";
import AssistantComposer from "@/components/wallet/home/AssistantComposer";
import AiProviderDialog from "@/components/wallet/ai/AiProviderDialog";

const HINTS = ["Open the swap screen", "Copy my address", "How is my portfolio today?"];

export default function AssistantCard({ holdings, total, changePct, onRefresh, address }) {
  const call = useServerFn(askAssistant);
  const navigate = useNavigate();
  const wallet = useWallet();
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [apiOpen, setApiOpen] = useState(false);
  const askRef = useRef(null);
  const bottom = useRef(null);

  const speech = useSpeech({ onFinal: (text) => askRef.current?.(text) });
  const { perform, done: did, reset: clearDid } = useAssistantActions({
    navigate,
    wallet,
    onRefresh,
    address,
    speech,
  });

  // Only the balances already on screen are sent along as context.
  const snapshot = useMemo(
    () => ({
      total: Number(total) || 0,
      changePct: Number(changePct) || 0,
      account: wallet.account,
      accounts: wallet.accounts,
      holdings: holdings
        .filter((item) => item.value > 0)
        .slice(0, 12)
        .map((item) => ({
          id: item.id,
          symbol: item.symbol,
          name: item.name,
          chain: item.chain,
          balance: Number(item.balance) || 0,
          value: Number(item.value) || 0,
        })),
    }),
    [holdings, total, changePct, wallet.account, wallet.accounts],
  );

  const ask = useCallback(
    async (raw) => {
      const question = String(raw || "").trim();
      if (!question || busy) return;
      const next = [...messages, { role: "user", text: question }];
      setMessages(next);
      clearDid();
      setBusy(true);
      try {
        const payload = { context: snapshot, history: next.slice(-10) };
        // Their own API key answers first; the built-in model only stands in when none is set.
        const { answer, actions } = (await askWithOwnProvider(payload)) || (await call({ data: payload }));
        setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
        speech.speak(answer);
        await perform(actions);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "I couldn't answer just now — please try again." },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, snapshot, call, speech, perform, clearDid],
  );

  useEffect(() => {
    askRef.current = ask;
  }, [ask]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy]);

  return (
    <section className="mt-3 rounded-2xl border border-foreground/[0.08] bg-card/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.9} />
          <h2 className="truncate text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Helix assistant
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
        <button
          type="button"
          onClick={() => speech.setVoiceOn((on) => !on)}
          aria-label={speech.voiceOn ? "Mute spoken replies" : "Unmute spoken replies"}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          {speech.voiceOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        </button>
      </div>

      {messages.length === 0 ? (
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
          Ask about your portfolio or tell me what to do — open Swap, copy my address, lock the wallet. Type or tap the mic.
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

      <AiProviderDialog open={apiOpen} onOpenChange={setApiOpen} />
    </section>
  );
}