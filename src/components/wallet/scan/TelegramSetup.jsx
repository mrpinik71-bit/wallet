import { useState } from "react";
import { Loader2, Link2 } from "lucide-react";
import { detectChat, saveBotToken, saveChatId, savedBot } from "@/lib/telegram-bot";

/** One-time setup: the bot token stays in this browser, so it works on any host. */
export default function TelegramSetup({ onReady }) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const alreadySaved = Boolean(savedBot().token);

  async function connect() {
    setBusy(true);
    setError("");
    setNote("");
    try {
      const value = token.trim() ? saveBotToken(token) : savedBot().token;
      if (!value) throw new Error("Paste your bot token first.");
      const chatId = await detectChat(value);
      if (!chatId) {
        setNote("Token saved. Now press Start in your bot's chat, then tap Connect bot again.");
        return;
      }
      saveChatId(chatId);
      onReady({ token: value, chatId });
    } catch (cause) {
      setError(cause.message || "Telegram could not be reached.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder={alreadySaved ? "Bot token saved" : "Bot token from @BotFather"}
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-xl border border-foreground/[0.1] bg-foreground/[0.03] px-3 py-2 font-mono text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none"
        />
        <button
          type="button"
          onClick={connect}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-70"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" strokeWidth={2.1} />}
          Connect bot
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[10.5px] leading-relaxed text-destructive">
          {error}
        </p>
      ) : null}

      {note ? (
        <p className="rounded-xl border border-primary/25 bg-primary/[0.06] px-3 py-2 text-[10.5px] leading-relaxed text-primary/90">
          {note}
        </p>
      ) : null}

      <p className="px-1 text-[10px] leading-relaxed text-muted-foreground/60">
        Paste the token once — it is kept in this browser only. The chat is found automatically once you press Start in
        your bot.
      </p>
    </div>
  );
}