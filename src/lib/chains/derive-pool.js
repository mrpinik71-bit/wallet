// Key derivation, spread over every core the device has.
//
// One phrase is one job and every job waits in the same line: a phrase is never
// stuck behind messages another batch sent to the same worker. That was the
// fault — every batch posted its own waves, so with dozens of batches in flight
// a wave's turn at a core came long after its clock had run out, the wave was
// thrown away, and the phrases were derived again on this thread: the page froze
// a few seconds into the scan. In one line, a job waits at most as long as the
// few phrases the cores are holding right now.
import { prepare } from "@/lib/chains/scan-derive";

const MAX_WORKERS = 32; // every core the device reports is put to work

// One phrase per job. A worker is never asked to hold a batch, so its answer is
// never late and this clock only catches a thread that has stopped answering.
const JOB_TIMEOUT = 20000;

// A worker that cannot load says nothing at all; a silent slot is retired rather
// than waited on.
const READY_TIMEOUT = 5000;

// A phrase derived on this thread blocks everything else, so the fallback hands
// the thread back between phrases and the page keeps painting.
const yieldThread = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Derives phrases in parallel. Returns null on a device that cannot run workers,
 * so the caller simply derives on the main thread instead.
 */
export function createDerivePool() {
  if (typeof Worker === "undefined" || typeof navigator === "undefined") return null;

  // Every core reports in. A 2 GB device, where the threads would fight over
  // memory instead of the CPU, is held to half of them.
  const memory = typeof navigator.deviceMemory === "number" ? navigator.deviceMemory : 8;
  const cores = Math.max(2, navigator.hardwareConcurrency || 2);
  const target = Math.min(MAX_WORKERS, memory <= 2 ? Math.max(2, Math.floor(cores / 2)) : cores);

  const slots = [];
  for (let index = 0; index < target; index += 1) {
    try {
      const worker = new Worker(new URL("./scan-worker.js", import.meta.url), { type: "module" });
      const slot = { worker, alive: true };
      worker.addEventListener("error", () => {
        slot.alive = false;
      });
      slots.push(slot);
    } catch {
      // A device that refuses workers keeps the ones it allowed.
    }
  }
  if (!slots.length) return null;

  const retire = (slot) => {
    slot.alive = false;
    try {
      slot.worker.terminate();
    } catch {
      // Already gone.
    }
  };

  // Each slot says it is ready before any phrase is sent to it.
  const settled = Promise.all(
    slots.map(
      (slot) =>
        new Promise((resolve) => {
          let done = false;
          const finish = (ok) => {
            if (done) return;
            done = true;
            if (!ok) retire(slot);
            resolve();
          };
          slot.worker.addEventListener("message", (event) => {
            if (event.data?.ready) finish(true);
          });
          setTimeout(() => finish(false), READY_TIMEOUT);
        }),
    ),
  );

  // The scan's one line of work.
  const queue = [];
  let closed = false;
  let waiters = [];
  const wake = () => {
    const list = waiters;
    waiters = [];
    list.forEach((fn) => fn());
  };
  const idle = () => new Promise((resolve) => waiters.push(resolve));

  let nextId = 1;
  const runOn = (slot, entry) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      let timer = null;
      const cleanup = () => {
        if (timer) clearTimeout(timer);
        slot.worker.removeEventListener("message", onMessage);
        slot.worker.removeEventListener("error", onError);
      };
      const fail = () => {
        cleanup();
        retire(slot);
        reject(new Error("derive worker stopped answering"));
      };
      const onMessage = (event) => {
        if (event.data?.id !== id) return;
        cleanup();
        resolve(event.data.wallets?.[0] || null);
      };
      const onError = () => fail();
      slot.worker.addEventListener("message", onMessage);
      slot.worker.addEventListener("error", onError);
      timer = setTimeout(fail, JOB_TIMEOUT);
      try {
        slot.worker.postMessage({ id, entries: [entry] });
      } catch {
        fail();
      }
    });

  async function lane(slot) {
    for (;;) {
      if (closed) return;
      const job = queue.shift();
      if (!job) {
        await idle();
        continue;
      }

      let wallet = null;
      if (slot.alive) {
        try {
          wallet = await runOn(slot, job.entry);
        } catch {
          wallet = null;
        }
      }

      if (!wallet) {
        job.attempts += 1;
        // A phrase a retired thread dropped goes back to the line, never to this
        // thread, as long as a core is still answering.
        if (job.attempts < 3 && slots.some((other) => other.alive)) {
          queue.push(job);
          wake();
          continue;
        }
        wallet = prepare(job.entry);
      }

      job.settle(wallet);
      wake();
    }
  }

  // Lanes start once the slots have said whether they are usable, and stay
  // parked on the line until the pool is closed.
  settled.then(() => {
    slots.filter((slot) => slot.alive).forEach((slot) => {
      lane(slot);
    });
  });

  /**
   * Every phrase derived, nothing skipped: `onWallet(position, wallet)` is called
   * the moment a phrase comes back, so the network reads start while the rest of
   * the batch is still deriving.
   */
  async function map(entries, isCancelled, onWallet) {
    await settled;
    const wallets = new Array(entries.length);

    const commit = (position, wallet) => {
      wallets[position] = wallet;
      onWallet?.(position, wallet);
    };

    // No thread could be started on this device: derived here, one at a time.
    if (!slots.some((slot) => slot.alive)) {
      for (let position = 0; position < entries.length; position += 1) {
        if (isCancelled?.()) break;
        commit(position, prepare(entries[position]));
        await yieldThread();
      }
      return wallets;
    }

    await new Promise((resolve) => {
      let remaining = entries.length;
      const finish = () => {
        remaining -= 1;
        if (remaining <= 0) resolve();
      };
      entries.forEach((entry, position) => {
        queue.push({
          entry,
          attempts: 0,
          settle: (wallet) => {
            commit(position, wallet || prepare(entry));
            finish();
          },
        });
      });
      wake();
    });

    return wallets;
  }

  function close() {
    closed = true;
    wake();
    for (const slot of slots) retire(slot);
    slots.length = 0;
  }

  return { size: slots.length, alive: () => slots.filter((slot) => slot.alive).length, map, close };
}