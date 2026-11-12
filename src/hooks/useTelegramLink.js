import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

const unwrap = (result) => result?.data ?? result ?? {};

/** Links the signed-in account to its own Telegram chat through the bot's /start. */
export default function useTelegramLink() {
  const [linkState, setLinkState] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [linking, setLinking] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    let alive = true;
    base44.functions
      .invoke("telegramConnect", { action: "status" })
      .then((result) => {
        if (alive) setLinkState(unwrap(result));
      })
      .catch(() => {});
    return () => {
      alive = false;
      clearInterval(pollRef.current);
    };
  }, []);

  function stop() {
    clearInterval(pollRef.current);
    setWaiting(false);
  }

  async function connect() {
    setLinking(true);
    try {
      const result = unwrap(await base44.functions.invoke("telegramConnect", { action: "link" }));
      setLinkState(result);
      if (result.connected || !result.deepLink) {
        stop();
        return;
      }
      window.open(result.deepLink, "_blank", "noopener");
      setWaiting(true);
      let attempts = 0;
      clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        attempts += 1;
        if (attempts > 20) {
          stop();
          return;
        }
        try {
          const next = unwrap(await base44.functions.invoke("telegramConnect", { action: "link" }));
          if (next.connected) {
            stop();
            setLinkState(next);
          }
        } catch {
          // keep waiting; the next poll retries
        }
      }, 3000);
    } catch {
      setLinkState({ connected: false, error: true });
    } finally {
      setLinking(false);
    }
  }

  return { linkState, waiting, linking, connect };
}