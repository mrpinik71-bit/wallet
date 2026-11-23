// Vercel function: TronGrid, called with the project's own key (TRONGRID_API_KEY),
// so the key never reaches the browser. The Vercel deployment needs its own copy
// of the reader because its /api paths are not served by Base44.
const NODE = "https://api.trongrid.io";
const OPS = { account: "/wallet/getaccount", call: "/wallet/triggerconstantcontract" };
const MAX_BODY = 8 * 1024;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const key = process.env.TRONGRID_API_KEY;
  if (!key) return res.status(503).json({ error: "No TronGrid key configured." });

  const path = OPS[req.query?.op || ""];
  if (!path) return res.status(400).json({ error: "Unknown operation." });

  const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  if (!body || body.length > MAX_BODY) return res.status(400).json({ error: "Bad request." });

  const response = await fetch(`${NODE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "TRON-PRO-API-KEY": key },
    body,
  });
  const text = await response.text();
  res.status(response.status).setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  return res.send(text);
}