import { fileURLToPath, URL } from "node:url";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// A static, browser-only build of this app for Vercel — vite.config.js (the Base44 build) stays untouched.
// It drops the Cloudflare Worker and the Base44 runtime scripts, so the output is plain files any static
// host serves. Everything the app does already runs on the device; the Base44 backend (data, functions)
// is reached over its HTTPS API.
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^base44:document$/,
        replacement: fileURLToPath(new URL("./vercel/base44-document.js", import.meta.url)),
      },
      {
        find: /^cloudflare:workers$/,
        replacement: fileURLToPath(new URL("./vercel/cloudflare-workers.js", import.meta.url)),
      },
      { find: /^@\//, replacement: fileURLToPath(new URL("./src/", import.meta.url)) },
    ],
  },
  define: {
    "import.meta.env.VITE_BASE44_APP_ID": JSON.stringify(
      process.env.VITE_BASE44_APP_ID || "6af5407f37d8e17b6e34abd8",
    ),
  },
  build: {
    outDir: "dist/vercel",
    emptyOutDir: true,
  },
  plugins: [tanstackStart({ srcDirectory: "src", spa: { enabled: true } }), react()],
});