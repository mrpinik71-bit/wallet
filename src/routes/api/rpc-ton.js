import { createFileRoute } from "@tanstack/react-router";
import { answered, askKeys, readOnce, relay } from "@/lib/relay-keys.server";

// Toncenter, called with YOUR keys on the server: the free tier's per-key budget
// answers many more wallets a minute than the anonymous one a browser gets.
// Only the balance read is relayed — this is a wallet's reader, not a node.
//
// TONCENTER_API_KEY may hold several keys separated by commas or spaces, and the
// keyless endpoint answers when none is left, so a TON read never fails over a
// key's budget.
const NODE = "https://toncenter.com/api/v2/getAddressBalance";

// A TON address is either the 48-character friendly form or "workchain:hash".
const isTonAddress = (value) =>
  typeof value === "string" && (/^[A-Za-z0-9_-]{46,50}$/.test(value) || /^-?\d+:[0-9a-fA-F]{64}$/.test(value));

async function balanceOf(request) {
  const address = new URL(request.url).searchParams.get("address") || "";
  if (!isTonAddress(address)) return Response.json({ error: "Bad address." }, { status: 400 });

  const url = `${NODE}?address=${encodeURIComponent(address)}`;
  const answer = await askKeys(
    "TONCENTER_API_KEY",
    (key) => readOnce(url, { headers: { "X-API-Key": key } }),
    answered,
  );
  if (answer.status >= 200 && answer.status < 300 && answered(answer.text)) return relay(answer);

  // No key left: Toncenter answers without one too.
  const fallback = await readOnce(url);
  return relay(fallback || answer);
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