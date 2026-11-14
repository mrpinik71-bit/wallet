import { useEffect } from "react";

// Keeps the screen awake while `active` is true, so a running scan is not cut
// off when the phone dims and locks. The browser drops the lock whenever the
// page is hidden, so it is requested again as soon as the page comes back.
export default function useWakeLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    let lock = null;
    let stopped = false;

    const acquire = async () => {
      if (stopped || !navigator.wakeLock || document.visibilityState !== "visible") return;
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // Not allowed or not supported: the scan still runs, the screen just sleeps.
        lock = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (lock?.release) lock.release().catch(() => {});
      lock = null;
    };
  }, [active]);
}