// Vercel function: Toncenter, called with the project's own key (TONCENTER_API_KEY),
// so the key never reaches the browser. Only the balance read is relayed.
const NODE = "https://toncenter.com/api/v2/getAddressBalance";

const isTonAddress = (value) =>
  typeof value === "string" && (/^[A-Za-z0-9_-]{46,50}$/.test(value) || /^-?\d+:[0-9a-fA-F]{64}$/.test(value));

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });

  const key = process.env.TONCENTER_API_KEY;
  if (!key) return res.status(503).json({ error: "No Toncenter key configured." });

  const address = req.query?.address || "";
  if (!isTonAddress(address)) return res.status(400).json({ error: "Bad address." });

  const response = await fetch(`${NODE}?address=${encodeURIComponent(address)}`, {
    headers: { "X-API-Key": key },
  });
  const text = await response.text();
  res.status(response.status).setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  return res.send(text);
}