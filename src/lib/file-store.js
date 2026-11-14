// Files the assistant writes and files inside the app. They live on this device
// as plain text, so the Files screen can show them again and download them.
const KEY = "helix.files.v1";
const LIMIT = 100; // newest first; older uploads fall off once the list is this long
export const DEFAULT_PLACE = "Uploads";

const clean = (value, fallback) => {
  const text = String(value || "")
    .replace(/[\\:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return text || fallback;
};

/** "Notes/plan.md" → place "Notes", name "plan.md"; a bare name goes to Uploads. */
export function splitTarget(target, fallbackName = "note.txt") {
  const raw = String(target || "").trim();
  const parts = raw.split("/").filter(Boolean);
  if (parts.length > 1) {
    return { place: clean(parts[0], DEFAULT_PLACE), name: clean(parts[parts.length - 1], fallbackName) };
  }
  return { place: DEFAULT_PLACE, name: clean(raw, fallbackName) };
}

function read() {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    return Array.isArray(stored)
      ? stored.filter((item) => item && typeof item.content === "string" && typeof item.name === "string")
      : [];
  } catch {
    return [];
  }
}

function write(list) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, LIMIT)));
  } catch {
    // A full storage keeps this change in memory for the session only.
  }
  window.dispatchEvent(new Event("helix:files"));
}

export const listFiles = () => read();

export const listPlaces = (files = read()) =>
  [...new Set(files.map((item) => item.place))].sort((a, b) => a.localeCompare(b));

/** Files the text; the same place and name replaces the previous version. */
export function storeFile(target, content) {
  const { place, name } = splitTarget(target);
  const list = read().filter((item) => !(item.place === place && item.name === name));
  const file = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    place,
    name,
    content: String(content ?? ""),
    created: Date.now(),
  };
  write([file, ...list]);
  return file;
}

export function deleteFile(id) {
  write(read().filter((item) => item.id !== id));
}

export const textBytes = (text) => new TextEncoder().encode(String(text || "")).length;