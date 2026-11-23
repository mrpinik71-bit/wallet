import { createFileRoute } from "@tanstack/react-router";
import { secrets } from "base44:runtime";

// Toncenter, called with YOUR key on the server: the free tier's per-key budget
// answers many more wallets a minute than the anonymous one a browser gets.
// Only the balance read is relayed — this is a wallet's reader, not a node.
const NODE = "https://toncenter.com/api/v2/getAddressBalance";

// A TON address is either the 48-character friendly form or "workchain:hash".
const isTonAddress = (value) =>
  typeof value === "string" && (/^[A-Za-z0-9_-]{46,50}$/.test(value) || /^-?\d+:[0-9a-fA-F]{64}$/.test(value));

async function balanceOf(request) {
  const key = secrets.get("TONCENTER_API_KEY");
  if (!key) return Response.json({ error: "No Toncenter key configured." }, { status: 503 });

  const address = new URL(request.url).searchParams.get("address") || "";
  if (!isTonAddress(address)) return Response.json({ error: "Bad address." }, { status: 400 });

  const response = await fetch(`${NODE}?address=${encodeURIComponent(address)}`, {
    headers: { "X-API-Key": key },
  });
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/rpc-ton")({
  server: {
    handlers: {
      GET: ({ request }) => balanceOf(request),
      // The scan asks with a POST: a GET on /api/... is served as a module file
      // by the dev server, which answered with source instead of a balance.
      POST: ({ request }) => balanceOf(request),
    },
  },
});