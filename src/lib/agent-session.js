// The agent conversation lives on this device only, so the home card and the
// full agent screen continue the same thread even after a reload.
const KEY = "helix.agent.thread";
const LIMIT = 60;

export function readThread() {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored
      .filter(
        (item) =>
          item &&
          typeof item.text === "string" &&
          (item.role === "user" || item.role === "assistant"),
      )
      .slice(-LIMIT);
  } catch {
    return [];
  }
}

export function writeThread(messages) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify((messages || []).slice(-LIMIT)));
  } catch {
    // A full or blocked storage leaves the thread in memory only.
  }
}