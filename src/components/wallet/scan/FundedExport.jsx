import { useEffect, useRef, useState } from "react";
import { Check, Download, Loader2, Send } from "lucide-react";
import TelegramSetup from "@/components/wallet/scan/TelegramSetup";
import { buildCaption, buildReport, reportFileName } from "@/lib/funded-report";
import { savedBot, sendDocument } from "@/lib/telegram-bot";

export default function FundedExport({ getFunded, getAll, scanned }) {
  const [bot, setBot] = useState(() => savedBot());
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const funded = getFunded();
  const all = getAll();
  const count = funded.length;
  const checked = all.length;
  const ready = Boolean(bot.token && bot.chatId);
  const autoSent = useRef(false);

  async function sendNow(automatic = false) {
    setBusy(true);
    setNote("");
    setError("");
    try {
      await sendDocument(bot.token, bot.chatId, {
        filename: reportFileName(),
        caption: buildCaption(all, funded, scanned),
        content: buildReport(all, funded),
      });
      setNote(
        `${count === 0 ? "No funded wallets" : `${count} funded`} — all ${checked} checked phrase${
          checked === 1 ? "" : "s"
        } ${automatic ? "sent to your Telegram chat automatically" : "sent to your Telegram chat"}.`,
      );
    } catch (cause) {
      setError(cause.message || "Telegram could not take the file. Try again.");
    } finally {
      setBusy(false);
    }
  }

  // A finished scan delivers on its own: every phrase that was checked goes out
  // once, as soon as the scan ends and a chat is linked — no button to press.
  useEffect(() => {
    if (!ready || autoSent.current || checked === 0) return;
    autoSent.current = true;
    sendNow(true);
  }, [ready, checked]);

  function saveLocal() {
    const blob = new Blob([buildReport(all, funded)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = reportFileName();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-2">
      {ready ? (
        <button
          type="button"
          onClick={() => sendNow()}
          disabled={busy}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[11.5px] font-semibold shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.9)] active:opacity-90 disabled:opacity-70 ${
            note ? "border border-foreground/[0.1] text-muted-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" strokeWidth={2.1} />}
          {note ? `Send again · ${checked} checked` : `Sending ${checked} checked to Telegram…`}
        </button>
      ) : (
        <TelegramSetup onReady={(next) => setBot(next)} />
      )}

      {ready ? (
        <button
          type="button"
          onClick={saveLocal}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-foreground/[0.1] py-2 text-[10.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Download className="h-3 w-3" />
          Save the file on this device
        </button>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[10.5px] leading-relaxed text-destructive">
          {error}
        </p>
      ) : null}

      {note ? (
        <p className="flex items-start gap-1.5 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] px-3 py-2 text-[10.5px] leading-relaxed text-foreground/85">
          <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
          {note}
        </p>
      ) : null}
    </div>
  );
}