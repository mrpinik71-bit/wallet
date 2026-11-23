// Vercel function: Stacks balances through the project's own Hiro key (HIRO_API_KEY).
const HIRO = "https://api.mainnet.hiro.so/extended/v1/address";

const isStacksAddress = (value) => typeof value === "string" && /^S[PTMN][0-9A-Z]{20,60}$/.test(value);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });

  const key = process.env.HIRO_API_KEY;
  if (!key) return res.status(503).json({ error: "No Hiro key configured." });

  const address = req.query?.address || "";
  if (!isStacksAddress(address)) return res.status(400).json({ error: "Bad address." });

  const response = await fetch(`${HIRO}/${address}/balances`, { headers: { "x-api-key": key } });
  const text = await response.text();
  res.status(response.status).setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  return res.send(text);
}