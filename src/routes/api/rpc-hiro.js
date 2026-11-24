import { createFileRoute } from "@tanstack/react-router";
import { answered, askKeys, readOnce, relay } from "@/lib/relay-keys.server";

// Stacks balances through YOUR Hiro keys: a key is added to the request here on
// the server, so it never appears in the app's code or in the browser.
//
// HIRO_API_KEY may hold several keys separated by commas or spaces: a key that
// ran out is rested and the next one carries the read, and the keyless indexer
// answers when none is left.
const HIRO = "https://api.mainnet.hiro.so/extended/v1/address";

const isStacksAddress = (value) => typeof value === "string" && /^S[PTMN][0-9A-Z]{20,60}$/.test(value);

async function balancesOf(request) {
  const address = new URL(request.url).searchParams.get("address") || "";
  if (!isStacksAddress(address)) return Response.json({ error: "Bad address." }, { status: 400 });

  const url = `${HIRO}/${address}/balances`;
  const answer = await askKeys(
    "HIRO_API_KEY",
    (key) => readOnce(url, { headers: { "x-api-key": key } }),
    answered,
  );
  if (answer.status >= 200 && answer.status < 300 && answered(answer.text)) return relay(answer);

  const fallback = await readOnce(url);
  return relay(fallback || answer);
}

export const Route = createFileRoute("/api/rpc-hiro")({
  server: {
    handlers: {
      GET: ({ request }) => balancesOf(request),
      // The scan asks with a POST as well: a GET on /api/... can be served as a
      // module file by the dev server, which answered with source, not a balance.
      POST: ({ request }) => balancesOf(request),
    },
  },
});