import { useState } from "react";
import { Download, Check, Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import useTelegramLink from "@/hooks/useTelegramLink";
import { buildCaption, buildReport, reportFileName } from "@/lib/funded-report";

export default function FundedExport({ getFunded, scanned }) {
  const { linkState, waiting, linking, connect } = useTelegramLink();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const funded = getFunded();
  const count = funded.length;

  async function sendNow() {
    setBusy(true);
    setNote("");
    try {
      const result = await base44.functions.invoke("telegramSend", {
        filename: reportFileName(),
        caption: buildCaption(funded, scanned),
        content: buildReport(funded),
      });
      const data = result?.data ?? result ?? {};
      if (data.sent) setNote(`Sent${data.username ? ` to @${data.username}` : " to your bot chat"}`);
      else setNote("Connect the bot first, then press send again.");
    } catch {
      setNote("Telegram could not take the file. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function saveLocal() {
    const blob = new Blob([buildReport(funded)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = reportFileName();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const connected = Boolean(linkState?.connected);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={connected ? sendNow : connect}
        disabled={busy || linking}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[11.5px] font-semibold text-primary-foreground shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.9)] active:opacity-90 disabled:opacity-70"
      >
        {busy || linking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" strokeWidth={2.1} />}
        {connected ? `Send ${count} funded phrase${count === 1 ? "" : "s"} to Telegram` : "Send to Telegram bot"}
      </button>

      {waiting ? (
        <p className="rounded-xl border border-primary/25 bg-primary/[0.06] px-3 py-2 text-[10.5px] leading-relaxed text-primary/90">
          Press <span className="font-semibold">Start</span> in the Telegram chat that just opened — this screen links
          automatically.
        </p>
      ) : null}

      {connected ? (
        <button
          type="button"
          onClick={saveLocal}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-foreground/[0.1] py-2 text-[10.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Download className="h-3 w-3" />
          Save the file on this device
        </button>
      ) : null}

      {note ? (
        <p className="flex items-center gap-1.5 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] px-3 py-2 text-[10.5px] text-foreground/85">
          <Check className="h-3 w-3 shrink-0 text-primary" />
          {note}
        </p>
      ) : null}
    </div>
  );
}