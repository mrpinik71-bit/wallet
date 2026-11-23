// Vercel function: Cardano balances. Koios sends no CORS header, so the browser
// cannot read it directly; the keyed Blockfrost indexer carries the read when
// Koios refuses or is down.
const KOIOS = "https://api.koios.rest/api/v1/address_info";
const BLOCKFROST = "https://cardano-mainnet.blockfrost.io/api/v0/addresses";
const MAX_ADDRESSES = 50;
const FROST_WORKERS = 8;

const isCardanoAddress = (value) => typeof value === "string" && /^addr1[0-9a-z]{20,120}$/i.test(value);

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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const addresses = [...new Set((Array.isArray(body.addresses) ? body.addresses : []).filter(isCardanoAddress))];
  if (!addresses.length) return res.status(200).json({ balances: {} });

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
      return res.status(200).json({ balances });
    }
  } catch {
    // Koios did not answer: the keyed indexer below carries the read.
  }

  const projectId = process.env.BLOCKFROST_PROJECT_ID;
  if (!projectId) return res.status(502).json({ balances: {}, error: "indexer unavailable" });
  return res.status(200).json({ balances: await blockfrostBalances(list, projectId) });
}