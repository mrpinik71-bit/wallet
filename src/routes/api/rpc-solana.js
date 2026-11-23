import { createFileRoute } from "@tanstack/react-router";
import { secrets } from "base44:runtime";

// Helius, called with YOUR key — added here on the server, so the key is never
// part of the app's code or of anything the browser can read. The scan posts its
// JSON-RPC batch (up to ten accounts) to this route and gets the node's answer.
const MAX_BODY = 256 * 1024;

// Only balance reads are relayed: this route is a wallet's reader, not a free
// general-purpose node, so nothing else a caller invents reaches your quota.
const READ_METHODS = new Set([
  "getmultipleaccounts",
  "getbalance",
  "getaccountinfo",
  "gettokenaccountsbyowner",
  "gettokenaccountbalance",
  "getlatestblockhash",
]);

export const Route = createFileRoute("/api/rpc-solana")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = secrets.get("HELIUS_API_KEY");
        if (!key) return Response.json({ error: "No Helius key configured." }, { status: 503 });

        const body = await request.text();
        if (!body || body.length > MAX_BODY) return Response.json({ error: "Bad request." }, { status: 400 });

        let calls;
        try {
          calls = JSON.parse(body);
        } catch {
          return Response.json({ error: "Bad request." }, { status: 400 });
        }
        const list = Array.isArray(calls) ? calls : [calls];
        const readsOnly = list.every(
          (call) => call && typeof call.method === "string" && READ_METHODS.has(call.method.toLowerCase()),
        );
        if (!readsOnly) return Response.json({ error: "Method not relayed." }, { status: 403 });

        const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(key)}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
        });
        const text = await response.text();
        return new Response(text, {
          status: response.status,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
      },
    },
  },
});