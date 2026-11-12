import { useState } from "react";
import { Check } from "lucide-react";
import TelegramSetup from "@/components/wallet/scan/TelegramSetup";
import { savedBot } from "@/lib/telegram-bot";

/** Connect the delivery bot up front, so it is ready before any scan runs. */
export default function TelegramPanel() {
  const [bot, setBot] = useState(() => savedBot());
  const ready = Boolean(bot.token && bot.chatId);

  return (
    <div className="relative mt-4 rounded-[18px] border border-foreground/[0.07] bg-foreground/[0.02] p-3.5">
      <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground/70">Telegram delivery</p>

      {ready ? (
        <div className="mt-2 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-foreground/85">
          <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
          Bot linked — funded phrases can be sent to your chat after a scan.
        </div>
      ) : (
        <div className="mt-2">
          <TelegramSetup onReady={(next) => setBot(next)} />
        </div>
      )}
    </div>
  );
}