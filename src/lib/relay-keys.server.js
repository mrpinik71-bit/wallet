import { secrets } from "base44:runtime";

// Every provider key this app relays with may hold a list: as many keys as you
// have, separated by commas, semicolons or spaces. A scan then spends all of them
// in turn instead of queueing behind one key's budget, and a key that was refused
// is rested so the next read starts on a fresh one — which is what keeps a chain
// read from failing just because one key ran out of calls.
const rest = new Map();
let cursor = 0;

/** Every key saved under this name, without duplicates. */
export function keysFor(name) {
  const raw = String(secrets.get(name) || "");
  return [...new Set(raw.split(/[\s,;]+/).filter(Boolean))];
}

/** The keys to try, starting on a different one each time and skipping rested ones. */
export function orderedKeys(name) {
  const list = keysFor(name);
  const now = Date.now();
  const live = list.filter((key) => (rest.get(key) || 0) <= now);
  const usable = live.length ? live : list;
  if (usable.length < 2) return usable;
  cursor = (cursor + 1) % usable.length;
  return [...usable.slice(cursor), ...usable.slice(0, cursor)];
}

/** A key that refused is rested: briefly when busy, for long when it is not valid. */
function restKey(key, status) {
  if (!key) return;
  if (status === 429) rest.set(key, Date.now() + 15000);
  else if (status === 401 || status === 402 || status === 403) rest.set(key, Date.now() + 600000);
}

/**
 * Asks every key in turn until one answers usefully. `run(key)` returns
 * { status, text }, and `usable(text)` decides whether that answer is a real one
 * — a provider can reply 200 with an error inside the body.
 */
export async function askKeys(name, run, usable = () => true) {
  const keys = orderedKeys(name);
  let last = null;
  for (const key of keys) {
    let answer = null;
    try {
      answer = await run(key);
    } catch {
      answer = null;
    }
    if (!answer) continue;
    last = answer;
    if (answer.status >= 200 && answer.status < 300 && usable(answer.text)) return { ...answer, key };
    restKey(key, answer.status);
  }
  return { ...(last || { status: 502, text: JSON.stringify({ error: "Upstream unavailable." }) }), key: null };
}

/** A fetch turned into the { status, text } shape the helpers above work with. */
export async function readOnce(url, init) {
  try {
    const response = await fetch(url, init);
    return { status: response.status, text: await response.text() };
  } catch {
    return null;
  }
}

/** True when this body is a real answer rather than an error dressed as one. */
export function answered(text) {
  if (!text) return false;
  try {
    const body = JSON.parse(text);
    if (Array.isArray(body)) return body.some((call) => call && call.result !== undefined);
    if (body && typeof body === "object" && body.error) return false;
    return true;
  } catch {
    return false;
  }
}

/** Hands an upstream answer back to the app unchanged. */
export function relay({ status, text }) {
  return new Response(text, {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}