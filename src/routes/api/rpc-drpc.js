import { createFileRoute } from "@tanstack/react-router";
import { DRPC_NETWORKS } from "@/lib/chains/drpc-relay";
import { chains } from "@/lib/chains/config";
import { answered, askKeys, readOnce, relay } from "@/lib/relay-keys.server";

// The dRPC gateway, called with YOUR keys — added here on the server, so they are
// never part of the app's code or of anything the browser can read.
// The scan posts its JSON-RPC batch to this route and gets the node's answer.
// Your dashboard's link shape: https://lb.drpc.live/<network>/<KEY>
//
// DRPC_API_KEY may hold several keys separated by commas or spaces: a key that is
// out of calls is rested and the next one carries the read, and when every key
// refuses the network's public node answers instead — so an EVM chain read never
// ends as failed only because a key was busy.
const GATEWAY = "https://lb.drpc.live";
const NETWORKS = new Set(Object.values(DRPC_NETWORKS));

// The public node for each network, asked when no key answers.
const PUBLIC = Object.fromEntries(
  Object.entries(DRPC_NETWORKS)
    .map(([chainId, network]) => [network, chains[chainId]?.rpc])
    .filter(([, url]) => Boolean(url)),
);

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

        const init = { method: "POST", headers: { "content-type": "application/json" }, body };
        const answer = await askKeys(
          "DRPC_API_KEY",
          (key) => readOnce(`${GATEWAY}/${encodeURIComponent(network)}/${encodeURIComponent(key)}`, init),
          answered,
        );
        if (answer.status >= 200 && answer.status < 300 && answered(answer.text)) return relay(answer);

        // No key left to try: this network's own public node carries the read.
        const fallback = PUBLIC[network] ? await readOnce(PUBLIC[network], init) : null;
        return relay(fallback || answer);
      },
    },
  },
});