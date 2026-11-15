import { createFileRoute } from "@tanstack/react-router";
import { secrets } from "base44:runtime";
import { DRPC_NETWORKS } from "@/lib/chains/drpc-relay";

// The dRPC gateway, called with YOUR key — added here on the server, so the key
// is never part of the app's code or of anything the browser can read.
// The scan posts its JSON-RPC batch to this route and gets the node's answer.
// Your dashboard's link shape: https://lb.drpc.live/<network>/<KEY>
const GATEWAY = "https://lb.drpc.live";
const NETWORKS = new Set(Object.values(DRPC_NETWORKS));

// Only balance reads are relayed: this route is a wallet's reader, not a free
// general-purpose node, so nothing else a caller invents reaches your quota.
const READ_METHODS = new Set([
  "eth_getbalance",
  "eth_call",
  "eth_blocknumber",
  "eth_chainid",
  "getmultipleaccounts",
  "getbalance",
  "gettokenaccountsbyowner",
  "getaccountinfo",
]);

const MAX_BODY = 256 * 1024;

export const Route = createFileRoute("/api/rpc-drpc")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = secrets.get("DRPC_API_KEY");
        if (!key) return Response.json({ error: "No dRPC key configured." }, { status: 503 });

        const network = new URL(request.url).searchParams.get("network") || "";
        if (!NETWORKS.has(network)) return Response.json({ error: "Unknown network." }, { status: 400 });

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

        const response = await fetch(`${GATEWAY}/${encodeURIComponent(network)}/${encodeURIComponent(key)}`, {
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