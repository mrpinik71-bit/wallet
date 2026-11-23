// TronGrid balance reads. The provider key lives in the app's backend function
// (`chainRelay`), so this host never holds a key of its own.
const RELAY = "https://glorious-vault-chain-core.base44.app/functions/chainRelay";

export default async function handler(req, res) {
  const query = { ...(req.query || {}) };
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? ""
      : typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body || {});

  const response = await fetch(RELAY, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ provider: "tron", query, body }),
  });
  const text = await response.text();
  res.status(response.status);
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  return res.send(text);
}