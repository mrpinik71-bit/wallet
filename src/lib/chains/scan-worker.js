// Worker thread entry: derives one phrase per message, so a scan keeps every
// core of the device busy while the main thread stays responsive.
import { prepare } from "@/lib/chains/scan-derive";

self.onmessage = (event) => {
  const { id, entry } = event.data || {};
  let wallet;
  try {
    wallet = prepare(entry);
  } catch {
    wallet = { invalid: true, error: "Addresses could not be derived from this phrase." };
  }
  self.postMessage({ id, wallet });
};