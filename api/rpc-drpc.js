// Vercel function: the dRPC gateway, called with the project's own key
// (DRPC_API_KEY). Only balance reads are relayed, so nothing a caller invents
// reaches the key's quota.
const GATEWAY = "https://lb.drpc.live";
const MAX_BODY = 256 * 1024;

// The networks this key serves, spelled as dRPC names them.
const NETWORKS = new Set([
  "ethereum",
  "bsc",
  "base",
  "arbitrum",
  "polygon",
  "optimism",
  "avalanche",
  "linea",
  "scroll",
  "zksync",
  "mantle",
  "celo",
  "gnosis",
  "cronos",
  "fantom",
  "unichain",
  "sonic",
  "sei",
  "core",
  "polygon-zkevm",
]);

const READ_METHODS = new Set([
  "eth_getbalance",
  "eth_call",
  "eth_blocknumber",
  "eth_chainid",
  "getmultipleaccounts",
  "getbalance",
  "gettokenaccountsbyowner",
  "getaccountinfo",
]);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const key = process.env.DRPC_API_KEY;
  if (!key) return res.status(503).json({ error: "No dRPC key configured." });

  const network = req.query?.network || "";
  if (!NETWORKS.has(network)) return res.status(400).json({ error: "Unknown network." });

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

  const response = await fetch(`${GATEWAY}/${encodeURIComponent(network)}/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  const text = await response.text();
  res.status(response.status).setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  return res.send(text);
}