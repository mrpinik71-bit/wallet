import { createFileRoute } from "@tanstack/react-router";

// Cardano balances, read through this app instead of by the browser: Koios — the
// public Cardano indexer — sends no CORS header, so a page cannot read it.
//
// A public route, because the wallet itself never asks anyone to sign in. It is
// read-only and takes only public addresses, so there is nothing to protect
// beyond keeping the request small: at most 50 addresses per call.
const KOIOS = "https://api.koios.rest/api/v1/address_info";
const MAX_ADDRESSES = 50;

const isCardanoAddress = (value) => typeof value === "string" && /^addr1[0-9a-z]{20,120}$/i.test(value);

export const Route = createFileRoute("/api/cardano-balances")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const addresses = [...new Set((Array.isArray(body?.addresses) ? body.addresses : []).filter(isCardanoAddress))];
        if (!addresses.length) return Response.json({ balances: {} });

        const list = addresses.slice(0, MAX_ADDRESSES);
        const response = await fetch(KOIOS, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ _addresses: list }),
        });
        if (!response.ok) return Response.json({ balances: {}, error: `indexer ${response.status}` }, { status: 502 });

        const rows = await response.json().catch(() => null);
        const balances = {};
        for (const row of Array.isArray(rows) ? rows : []) {
          if (!row?.address) continue;
          balances[row.address] = String(row.balance ?? "0");
        }
        return Response.json({ balances });
      },
    },
  },
});