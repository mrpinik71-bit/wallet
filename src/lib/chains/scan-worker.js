// Worker thread entry: derives a wave of phrases per message, so a scan keeps
// every core of the device busy while the main thread stays responsive.
import { prepare } from "@/lib/chains/scan-derive";

self.onmessage = (event) => {
  const { id, entries } = event.data || {};
  const wallets = (entries || []).map((entry) => {
    try {
      return prepare(entry);
    } catch {
      return { invalid: true, error: "Addresses could not be derived from this phrase." };
    }
  });
  self.postMessage({ id, wallets });
};