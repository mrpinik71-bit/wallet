// The agent conversation lives on this device only, so the home card and the
// full agent screen continue the same thread even after a reload. Attached file
// contents are sent with their turn but not kept in storage.
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
      .slice(-LIMIT)
      .map((item) => ({ role: item.role, text: item.text }));
  } catch {
    return [];
  }
}

export function writeThread(messages) {
  if (typeof window === "undefined") return;
  try {
    const plain = (messages || [])
      .map((item) => ({ role: item.role, text: item.text }))
      .slice(-LIMIT);
    window.localStorage.setItem(KEY, JSON.stringify(plain));
  } catch {
    // A full or blocked storage leaves the thread in memory only.
  }
}