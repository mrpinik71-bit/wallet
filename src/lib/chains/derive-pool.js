// Key derivation, spread over every core the device has. A bulk scan is bound by
// derivation rather than by the network — the same phrase has to be turned into
// two dozen addresses before anything can be asked about it — so every core is
// put to work, and phrases travel in waves so a worker is never left waiting on
// a message round trip between two phrases.
import { prepare } from "@/lib/chains/scan-derive";

const MAX_WORKERS = 32; // a 16-core machine uses all 16; a phone uses whatever it reports

// Phrases per message. One message per phrase left every worker idle for a full
// round trip between phrases, which at this scale was most of the wall clock.
const WAVE = 32;

// A worker that never answers (a module the browser refused to load, a thread
// killed under memory pressure) must not hold the whole scan: after this the
// phrase is derived on the main thread instead.
const DERIVE_TIMEOUT = 8000;

/**
 * Derives phrases in parallel. Returns null on a device that cannot run workers,
 * so the caller simply derives on the main thread instead.
 */
export function createDerivePool() {
  if (typeof Worker === "undefined" || typeof navigator === "undefined") return null;

  // Every core reports in, with no lane held back.
  // A phone reports 8 cores but has little memory for 8 copies of the derivation
  // code, so a low-memory device gets a smaller pool rather than a stalled tab.
  const memory = typeof navigator.deviceMemory === "number" ? navigator.deviceMemory : 8;
  const ceiling = memory <= 4 ? 4 : MAX_WORKERS;
  const target = Math.min(ceiling, Math.max(2, navigator.hardwareConcurrency || 2));
  const slots = [];
  for (let index = 0; index < target; index += 1) {
    try {
      const worker = new Worker(new URL("./scan-worker.js", import.meta.url), { type: "module" });
      const slot = { worker, alive: true };
      // A module that cannot load fires its error before the first phrase is
      // ever sent: the slot is retired now, so nothing waits on it.
      worker.addEventListener("error", () => {
        slot.alive = false;
      });
      slots.push(slot);
    } catch {
      // A device that refuses workers keeps the ones it allowed.
    }
  }
  if (!slots.length) return null;

  let nextId = 1;

  const runOn = (slot, entries) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      let timer = null;
      const cleanup = () => {
        if (timer) clearTimeout(timer);
        slot.worker.removeEventListener("message", onMessage);
        slot.worker.removeEventListener("error", onError);
      };
      const fail = (reason) => {
        cleanup();
        slot.alive = false;
        reject(new Error(reason));
      };
      const onMessage = (event) => {
        if (event.data?.id !== id) return;
        cleanup();
        resolve(event.data.wallets);
      };
      const onError = () => fail("derive worker failed");
      slot.worker.addEventListener("message", onMessage);
      slot.worker.addEventListener("error", onError);
      timer = setTimeout(() => fail("derive worker timed out"), DERIVE_TIMEOUT);
      try {
        slot.worker.postMessage({ id, entries });
      } catch (error) {
        fail(error?.message || "derive worker failed");
      }
    });

  /**
   * Every phrase derived, nothing skipped: each phrase is handed to a worker the
   * moment a lane is free, and `onWallet` is called as it comes back so the
   * network reads start while the rest are still being derived.
   */
  async function map(entries, isCancelled, onWallet) {
    const wallets = new Array(entries.length);
    let cursor = 0;

    const lane = async (slot) => {
      while (!isCancelled?.()) {
        const start = cursor;
        cursor += WAVE;
        if (start >= entries.length) return;
        const wave = entries.slice(start, start + WAVE);

        let derived = null;
        if (slot.alive) {
          try {
            derived = await runOn(slot, wave);
          } catch {
            // A worker that could not start or crashed is retired; this wave and
            // the rest of the lane are derived here instead.
            slot.alive = false;
            try {
              slot.worker.terminate();
            } catch {
              // Already gone.
            }
          }
        }

        wave.forEach((entry, offset) => {
          const position = start + offset;
          // The inline path keeps the scan complete rather than fast.
          const wallet = derived?.[offset] || prepare(entry);
          wallets[position] = wallet;
          onWallet?.(position, wallet);
        });

        // Derived here rather than in a worker: the thread is handed back
        // between waves, so the scan's own progress keeps painting.
        if (!derived) await new Promise((resolve) => setTimeout(resolve, 0));
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