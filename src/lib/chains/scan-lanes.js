// One shared request budget for everything the bulk scan asks a public node.
//
// A batched read asks a single node about many wallets at once, which is far
// heavier than one address lookup. Without a budget the scan's parallel lanes
// turn into a wall of 429s — and a 429 used to be read as "this batch is too
// big", which shrank the batch size for the rest of the run until every read
// was a single call and the chain looked broken. Now each node has its own
// request lanes, a refusal only slows that node down, and the read is retried
// instead of being written off.

import { visibleTimeout } from "@/lib/scan-visibility";

const START_LANES = 48;
// The deployment's own functions are one budget, not one per route: Vercel
// throttles a deployment by how many functions run at once, so the relay lanes
// share this ceiling. It is what several keys per provider are spent against.
const RELAY = "relay";
const RELAY_LANES = 64;
const lanes = new Map();
const caps = new Map();

export const capOf = (host) => caps.get(host) ?? (host === RELAY ? RELAY_LANES : START_LANES);

/** A node that refused the burst is busy, not gone: ask it less often. */
export function slowHost(host) {
  if (!host) return;
  // The relay is backed by the whole key list, so a refusal there is one busy
  // key, not a spent budget: it narrows without giving up most of the lanes.
  const floor = host === RELAY ? 32 : 1;
  caps.set(host, Math.max(floor, Math.floor(capOf(host) / 2)));
}

export function hostKey(url) {
  const text = String(url || "");
  // A relative path is served by this deployment's own functions, so every relay
  // call shares one lane instead of one lane per query string: a hundred lanes
  // at once is what made the deployment throttle its own functions.
  if (text.startsWith("/")) return RELAY;
  try {
    return new URL(text).host;
  } catch {
    return text;
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Waits for a slot on this host and resolves with the function that frees it. */
function slot(host) {
  const lane = lanes.get(host) || { active: 0, queue: [] };
  lanes.set(host, lane);
  return new Promise((resolve) => {
    const start = () => {
      lane.active += 1;
      resolve(() => {
        lane.active -= 1;
        const next = lane.queue.shift();
        if (next) next();
      });
    };
    if (lane.active < capOf(host)) start();
    else lane.queue.push(start);
  });
}

/**
 * One request inside its host's budget. A busy answer is retried with a short
 * backoff and narrows that host's lanes, so the retry lands after the burst has
 * cleared instead of failing the batch.
 */
export async function request(url, init = {}, { timeout = 15000, attempts = 3 } = {}) {
  const host = hostKey(url);
  let lastError = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const release = await slot(host);
    const controller = new AbortController();
    // The abort clock stops while the page is hidden: a request that was in
    // flight when the app went to the background is given its full time when
    // it comes back instead of being cut off.
    const timer = visibleTimeout(() => controller.abort(), timeout);
    let response = null;
    try {
      response = await fetch(url, { ...init, signal: controller.signal });
    } catch (cause) {
      lastError = cause instanceof Error ? cause : new Error("This node did not answer.");
    } finally {
      timer.stop();
      release();
    }

    if (response) {
      if (response.status !== 429) return response;
      slowHost(host);
      lastError = new Error("This node is busy (429).");
      lastError.status = 429;
    }

    if (attempt < attempts - 1) await wait(250 * 2 ** attempt + Math.random() * 150);
  }

  throw lastError || new Error("This node did not answer.");
}

/** Every fresh scan starts with full lanes and every node trusted again. */
export function resetLanes() {
  lanes.clear();
  caps.clear();
}