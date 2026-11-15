// Cardano balance reads for the wallet.
//
// The public Koios indexer answers without a CORS header, so a browser cannot
// read it directly. This function makes that same lookup server-side and hands
// the balances back, which is the only way Cardano can be read at all from the
// page. It is not a general proxy: the URL is fixed and only mainnet payment
// addresses in the wallet's own format are forwarded.

const KOIOS = "https://api.koios.rest/api/v1/address_info";
// Shelley base addresses the wallet derives: "addr1" plus ~99 bech32 chars.
const ADDRESS = /^addr1[0-9a-z]{20,110}$/;
const MAX_ADDRESSES = 50;

export default async function (req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const asked = Array.isArray(body?.addresses) ? body.addresses.map((item: unknown) => String(item)) : [];
    const addresses = [...new Set(asked.filter((item: string) => ADDRESS.test(item)))].slice(0, MAX_ADDRESSES);
    if (!addresses.length) return Response.json({ balances: {} });

    const response = await fetch(KOIOS, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ _addresses: addresses }),
    });
    // One indexer is behind this call: a busy answer is reported as such so the
    // scan asks again instead of recording zero funds.
    if (!response.ok) return Response.json({ error: "Cardano indexer is busy" }, { status: 502 });

    const rows = await response.json().catch(() => []);
    const balances: Record<string, string> = {};
    for (const row of Array.isArray(rows) ? rows : []) {
      if (row?.address) balances[row.address] = String(row.balance ?? 0);
    }
    // An address the indexer does not know has never been funded.
    return Response.json({ balances });
  } catch (error: any) {
    return Response.json({ error: String(error?.message || "Cardano read failed") }, { status: 500 });
  }
}