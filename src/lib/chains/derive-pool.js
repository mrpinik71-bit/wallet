// Key derivation, spread over the device's cores. A bulk scan is bound by
// derivation rather than by the network — the same phrase has to be turned into
// a dozen addresses before anything can be asked about it — so deriving on
// worker threads is what actually makes a scan faster.
import { prepare } from "@/lib/chains/scan-derive";

const MAX_WORKERS = 4;

/**
 * Derives phrases in parallel. Returns null on a device that cannot run workers,
 * so the caller simply derives on the main thread instead.
 */
export function createDerivePool() {
  if (typeof Worker === "undefined" || typeof navigator === "undefined") return null;

  // One core stays with the page, so the interface keeps painting while a scan runs.
  const target = Math.min(MAX_WORKERS, Math.max(1, (navigator.hardwareConcurrency || 2) - 1));
  const slots = [];
  for (let index = 0; index < target; index += 1) {
    try {
      slots.push({ worker: new Worker(new URL("./scan-worker.js", import.meta.url), { type: "module" }), alive: true });
    } catch {
      // A device that refuses workers keeps the ones it allowed.
    }
  }
  if (!slots.length) return null;

  let nextId = 1;

  const runOn = (slot, entry) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      const cleanup = () => {
        slot.worker.removeEventListener("message", onMessage);
        slot.worker.removeEventListener("error", onError);
      };
      const onMessage = (event) => {
        if (event.data?.id !== id) return;
        cleanup();
        resolve(event.data.wallet);
      };
      const onError = () => {
        cleanup();
        reject(new Error("derive worker failed"));
      };
      slot.worker.addEventListener("message", onMessage);
      slot.worker.addEventListener("error", onError);
      try {
        slot.worker.postMessage({ id, entry });
      } catch (error) {
        cleanup();
        reject(error);
      }
    });

  /** Every phrase derived, in the order it arrived. Nothing is skipped. */
  async function map(entries, isCancelled) {
    const wallets = new Array(entries.length);
    let cursor = 0;

    const lane = async (slot) => {
      while (!isCancelled?.()) {
        const position = cursor++;
        if (position >= entries.length) return;
        let wallet = null;
        if (slot.alive) {
          try {
            wallet = await runOn(slot, entries[position]);
          } catch {
            // A worker that could not start or crashed is retired; this phrase
            // and the rest of the lane are derived here instead.
            slot.alive = false;
            try {
              slot.worker.terminate();
            } catch {
              // Already gone.
            }
          }
        }
        // The inline path keeps the scan complete rather than fast.
        wallets[position] = wallet || prepare(entries[position]);
      }
    };

    await Promise.all(slots.map(lane));
    return wallets;
  }

  function close() {
    for (const slot of slots) {
      try {
        slot.worker.terminate();
      } catch {
        // Already gone.
      }
      slot.alive = false;
    }
    slots.length = 0;
  }

  return { size: slots.length, map, close };
}