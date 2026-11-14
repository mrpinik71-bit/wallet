// Vercel serves "/" from index.html, but the static build emits a single prerendered
// shell (_shell.html) with no index.html. Copy it to index.html so the home route and
// the rewrite fallback both resolve to a real file.
import { copyFile, access } from "node:fs/promises";

const dir = new URL("../dist/vercel/client/", import.meta.url);
const shell = new URL("_shell.html", dir);
const index = new URL("index.html", dir);

await access(shell);
await copyFile(shell, index);
console.log("[vercel] index.html written from _shell.html");