import { createFileRoute } from "@tanstack/react-router";
import { keysFor } from "@/lib/relay-keys.server";

// Cardano balances, read through this app instead of by the browser: Koios — the
// public Cardano indexer — sends no CORS header, so a page cannot read it.
//
// A public route, because the wallet itself never asks anyone to sign in. It is
// read-only and takes only public addresses, so there is nothing to protect
// beyond keeping the request small: at most 50 addresses per call.
const KOIOS = "https://api.koios.rest/api/v1/address_info";
// The keyed indexer, used only when Koios refuses or does not answer at all.
const BLOCKFROST = "https://cardano-mainnet.blockfrost.io/api/v0/addresses";
const MAX_ADDRESSES = 50;
// Blockfrost answers one address at a time, so a few are read at once.
const FROST_WORKERS = 8;

const isCardanoAddress = (value) => typeof value === "string" && /^addr1[0-9a-z]{20,120}$/i.test(value);

/** Lovelace per address from Blockfrost. An address it has never seen holds nothing. */
async function blockfrostBalances(list, projectId) {
  const balances = {};
  let next = 0;
  const worker = async () => {
    while (next < list.length) {
      const address = list[next];
      next += 1;
      try {
        const response = await fetch(`${BLOCKFROST}/${address}`, { headers: { project_id: projectId } });
        if (response.status === 404) {
          balances[address] = "0";
          continue;
        }
        if (!response.ok) continue;
        const data = await response.json();
        const lovelace = (Array.isArray(data?.amount) ? data.amount : []).find((item) => item.unit === "lovelace");
        if (lovelace?.quantity !== undefined) balances[address] = String(lovelace.quantity);
      } catch {
        // Left out of the map: a missing address is read as zero by the caller.
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(FROST_WORKERS, list.length) }, worker));
  return balances;
}

export const Route = createFileRoute("/api/cardano-balances")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const addresses = [...new Set((Array.isArray(body?.addresses) ? body.addresses : []).filter(isCardanoAddress))];
        if (!addresses.length) return Response.json({ balances: {} });

        const list = addresses.slice(0, MAX_ADDRESSES);
        try {
          const response = await fetch(KOIOS, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ _addresses: list }),
          });
          if (response.ok) {
            const rows = await response.json();
            const balances = {};
            for (const row of Array.isArray(rows) ? rows : []) {
              if (!row?.address) continue;
              balances[row.address] = String(row.balance ?? "0");
            }
            return Response.json({ balances });
          }
        } catch {
          // Koios did not answer: the keyed indexer below carries the read.
        }

        // BLOCKFROST_PROJECT_ID may hold several projects separated by commas or
        // spaces: one that is out of budget is passed over for the next, so the
        // keyed indexer never leaves a Cardano read unanswered.
        const projectIds = keysFor("BLOCKFROST_PROJECT_ID");
        if (!projectIds.length) return Response.json({ balances: {}, error: "indexer unavailable" }, { status: 502 });

        let balances = {};
        for (const projectId of projectIds) {
          balances = await blockfrostBalances(list, projectId);
          if (Object.keys(balances).length) break;
        }
        return Response.json({ balances });
      },
    },
  },
});