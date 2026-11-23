import { createFileRoute } from "@tanstack/react-router";
import { secrets } from "base44:runtime";

// Token discovery for the networks whose public indexers block this app:
// one free Etherscan V2 key covers all of them, and the key stays on the server.
const CHAIN_IDS = {
  ethereum: 1,
  base: 8453,
  arbitrum: 42161,
  polygon: 137,
  gnosis: 100,
  optimism: 10,
};

const API = "https://api.etherscan.io/v2/api";
const isAddress = (value) => typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);

export const Route = createFileRoute("/api/token-discovery")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const key = secrets.get("ETHERSCAN_API_KEY");
        if (!key) return Response.json({ error: "No Etherscan key configured." }, { status: 503 });

        const params = new URL(request.url).searchParams;
        const chainId = CHAIN_IDS[params.get("chain")];
        const address = params.get("address") || "";
        if (!chainId) return Response.json({ error: "Unknown chain." }, { status: 400 });
        if (!isAddress(address)) return Response.json({ error: "Bad address." }, { status: 400 });

        const url =
          `${API}?chainid=${chainId}&module=account&action=addresstokenbalance` +
          `&address=${address}&page=1&offset=100&apikey=${key}`;

        const response = await fetch(url);
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload) return Response.json({ error: "Indexer error." }, { status: 502 });

        // status "0" means the indexer answered with nothing held, not a failure.
        if (payload.status !== "1" || !Array.isArray(payload.result)) {
          return Response.json({ tokens: [] }, { headers: { "cache-control": "no-store" } });
        }

        const tokens = payload.result
          .map((row) => {
            const decimals = Number(row.TokenDivisor ?? 18);
            const places = Number.isFinite(decimals) ? decimals : 18;
            const raw = Number(row.TokenQuantity ?? 0);
            return {
              address: row.TokenAddress || "",
              symbol: String(row.TokenSymbol || "?").slice(0, 12),
              name: String(row.TokenName || row.TokenSymbol || "Unknown token").slice(0, 40),
              decimals: places,
              balance: Number.isFinite(raw) ? raw / 10 ** places : 0,
            };
          })
          .filter((token) => token.address && token.balance > 0);

        return Response.json({ tokens }, { headers: { "cache-control": "no-store" } });
      },
    },
  },
});