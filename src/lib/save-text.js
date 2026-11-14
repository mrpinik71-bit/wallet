// Saves text the assistant wrote as a file the user can open, edit or download.
// Kept on the device — nothing is uploaded.
const TYPES = {
  txt: "text/plain;charset=utf-8",
  md: "text/markdown;charset=utf-8",
  csv: "text/csv;charset=utf-8",
  json: "application/json;charset=utf-8",
  html: "text/html;charset=utf-8",
};

export function saveTextFile(name, text) {
  const safe = String(name || "helix-note.txt")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .slice(0, 80);
  const match = safe.match(/\.([a-z0-9]+)$/i);
  const ext = match && TYPES[match[1].toLowerCase()] ? match[1].toLowerCase() : "txt";
  const filename = match && TYPES[match[1].toLowerCase()] ? safe : `${safe.replace(/\.[a-z0-9]+$/i, "")}.${ext}`;

  const blob = new Blob([String(text || "")], { type: TYPES[ext] });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return filename;
}