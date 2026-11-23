// Stacks balances through the app's backend function (Hiro key server-side).
const RELAY = "https://glorious-vault-chain-core.base44.app/functions/chainRelay";

export default async function handler(req, res) {
  const response = await fetch(RELAY, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ provider: "hiro", query: { ...(req.query || {}) }, body: "" }),
  });
  const text = await response.text();
  res.status(response.status);
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  return res.send(text);
}