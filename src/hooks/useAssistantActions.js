import { useCallback, useState } from "react";
import { SCREEN_ACTIONS } from "@/lib/assistant-actions";

/**
 * Runs the tasks the assistant asked for, on this device. Anything the model
 * invents is ignored: only ids from the shared catalogue do something.
 */
export default function useAssistantActions({ navigate, wallet, onRefresh, address, speech }) {
  const [done, setDone] = useState("");

  const reset = useCallback(() => setDone(""), []);

  const perform = useCallback(
    async (actions) => {
      if (!Array.isArray(actions) || !actions.length) return;
      setDone("");
      let message = "";

      for (const action of actions.slice(0, 3)) {
        const id = action?.id;
        if (!id) continue;

        const screen = SCREEN_ACTIONS[id];
        if (screen) {
          navigate({ to: screen.route });
          message = action.label || screen.done;
          continue;
        }

        if (id === "refresh") {
          await onRefresh?.();
          message = action.label || "Balances refreshed";
        } else if (id === "copy_address") {
          try {
            await navigator.clipboard.writeText(address || "");
            message = action.label || "Address copied";
          } catch {
            message = "This browser blocked the clipboard — copy it from Receive";
          }
        } else if (id === "add_account") {
          wallet?.addAccount?.();
          message = action.label || `Account ${(wallet?.accounts || 1) + 1} added`;
        } else if (id === "switch_account") {
          const wanted = Number(action.arg);
          const total = wallet?.accounts || 1;
          if (Number.isInteger(wanted) && wanted >= 1 && wanted <= total) {
            wallet?.setAccount?.(wanted - 1);
            message = action.label || `Switched to account ${wanted}`;
          } else {
            message = `This wallet has accounts 1 to ${total}`;
          }
        } else if (id === "lock_wallet") {
          wallet?.lock?.();
          message = action.label || "Wallet locked";
        } else if (id === "voice_off" || id === "voice_on") {
          speech?.setVoiceOn?.(id === "voice_on");
          message = action.label || (id === "voice_on" ? "Spoken replies on" : "Spoken replies off");
        }
      }

      if (message) setDone(message);
    },
    [navigate, wallet, onRefresh, address, speech],
  );

  return { perform, done, reset };
}