import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { askAssistant } from "@/lib/assistant-fns";
import { askWithOwnProvider } from "@/lib/ask-assistant";
import useSpeech from "@/hooks/useSpeech";
import useAssistantActions from "@/hooks/useAssistantActions";
import { useWallet } from "@/lib/WalletContext";
import { readThread, writeThread } from "@/lib/agent-session";

/**
 * One agent thread, shared by the home card and the full agent screen.
 * It answers any question and then runs the steps the model asked for, in
 * order, using only the actions in the shared catalogue.
 */
export default function useAgentChat({ holdings = [], total = 0, changePct = 0, onRefresh, address }) {
  const call = useServerFn(askAssistant);
  const navigate = useNavigate();
  const wallet = useWallet();
  const [messages, setMessages] = useState(() => readThread());
  const [busy, setBusy] = useState(false);
  const askRef = useRef(null);

  const speech = useSpeech({ onFinal: (text) => askRef.current?.(text) });
  const { perform, done, reset } = useAssistantActions({
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
      holdings: (holdings || [])
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
    async (raw, file) => {
      const question = String(raw || "").trim();
      const attached = file && file.text ? file : null;
      if ((!question && !attached) || busy) return;
      const label = question || `Rewrite this file: ${attached.name}`;
      // The bubble stays short; the file body rides along with this one turn only.
      const shown = attached ? `${label}\n📎 ${attached.name}` : label;
      const sent = attached
        ? `${label}\n\n<<<FILE ${attached.name}\n${attached.text}\nFILE>>>`
        : label;
      const next = [...messages, { role: "user", text: shown, prompt: sent }];
      setMessages(next);
      reset();
      setBusy(true);
      try {
        const payload = {
          context: snapshot,
          history: next.slice(-12).map((item) => ({
            role: item.role,
            text: (item.prompt || item.text).slice(0, 12000),
          })),
        };
        // Their own API key answers first; the built-in model stands in when none is set.
        const reply = (await askWithOwnProvider(payload)) || (await call({ data: payload }));
        setMessages((prev) => [...prev, { role: "assistant", text: reply.answer }]);
        speech.speak(reply.answer);
        await perform(reply.actions);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "I couldn't answer just now — please try again." },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, snapshot, call, speech, perform, reset],
  );

  useEffect(() => {
    askRef.current = ask;
  }, [ask]);

  useEffect(() => {
    writeThread(messages);
  }, [messages]);

  const clear = useCallback(() => {
    setMessages([]);
    reset();
  }, [reset]);

  return { messages, busy, ask, clear, speech, done, reset };
}