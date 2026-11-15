import { createFileRoute } from "@tanstack/react-router";
import { secrets } from "base44:runtime";

// Stacks balances through YOUR Hiro key: the key is added to the request here on
// the server, so it never appears in the app's code or in the browser.
const HIRO = "https://api.mainnet.hiro.so/extended/v1/address";

const isStacksAddress = (value) => typeof value === "string" && /^S[PTMN][0-9A-Z]{20,60}$/.test(value);

export const Route = createFileRoute("/api/rpc-hiro")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const key = secrets.get("HIRO_API_KEY");
        if (!key) return Response.json({ error: "No Hiro key configured." }, { status: 503 });

        const address = new URL(request.url).searchParams.get("address") || "";
        if (!isStacksAddress(address)) return Response.json({ error: "Bad address." }, { status: 400 });

        const response = await fetch(`${HIRO}/${address}/balances`, { headers: { "x-api-key": key } });
        const text = await response.text();
        return new Response(text, {
          status: response.status,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
      },
    },
  },
});