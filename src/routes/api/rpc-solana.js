import { createFileRoute } from "@tanstack/react-router";
import { answered, askKeys, readOnce, relay } from "@/lib/relay-keys.server";

// Helius, called with YOUR keys — added here on the server, so they are never
// part of the app's code or of anything the browser can read. The scan posts its
// JSON-RPC batch (up to ten accounts) to this route and gets the node's answer.
//
// HELIUS_API_KEY may hold several keys separated by commas or spaces: a key that
// is out of calls is rested and the next one carries the read, and when every key
// refuses the public node answers instead — so a chain read never ends as failed
// only because a key was busy.
const GATEWAY = "https://mainnet.helius-rpc.com/?api-key=";
const PUBLIC = "https://api.mainnet-beta.solana.com";
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

        const init = { method: "POST", headers: { "content-type": "application/json" }, body };
        const answer = await askKeys(
          "HELIUS_API_KEY",
          (key) => readOnce(`${GATEWAY}${encodeURIComponent(key)}`, init),
          answered,
        );
        if (answer.status >= 200 && answer.status < 300 && answered(answer.text)) return relay(answer);

        // No key left to try: the public node carries the read.
        const fallback = await readOnce(PUBLIC, init);
        return relay(fallback || answer);
      },
    },
  },
});