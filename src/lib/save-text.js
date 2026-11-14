// Saves plain text the assistant wrote as a file the user can open, edit or
// download. Kept on the device — nothing is uploaded.
export function saveTextFile(name, text) {
  const safe = String(name || "helix-note.txt")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .slice(0, 80);
  const filename = /\.(txt|md|csv|json)$/i.test(safe) ? safe : `${safe}.txt`;

  const blob = new Blob([String(text || "")], { type: "text/plain;charset=utf-8" });
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