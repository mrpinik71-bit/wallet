// Vercel function: Helius, called with the project's own key (HELIUS_API_KEY).
// Only balance reads are relayed: this is a wallet's reader, not a free node.
const MAX_BODY = 256 * 1024;

const READ_METHODS = new Set([
  "getmultipleaccounts",
  "getbalance",
  "getaccountinfo",
  "gettokenaccountsbyowner",
  "gettokenaccountbalance",
  "getlatestblockhash",
]);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const key = process.env.HELIUS_API_KEY;
  if (!key) return res.status(503).json({ error: "No Helius key configured." });

  const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  if (!body || body.length > MAX_BODY) return res.status(400).json({ error: "Bad request." });

  let calls;
  try {
    calls = JSON.parse(body);
  } catch {
    return res.status(400).json({ error: "Bad request." });
  }
  const list = Array.isArray(calls) ? calls : [calls];
  const readsOnly = list.every(
    (call) => call && typeof call.method === "string" && READ_METHODS.has(call.method.toLowerCase()),
  );
  if (!readsOnly) return res.status(403).json({ error: "Method not relayed." });

  const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  const text = await response.text();
  res.status(response.status).setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  return res.send(text);
}