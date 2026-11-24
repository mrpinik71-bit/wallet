// Solana reads on this deployment: Helius is called with the project's own
// HELIUS_API_KEY. Without one, the public Solana nodes are read.
import { send, solanaRpc } from "./_providers.js";

export default async function handler(req, res) {
  const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  const { status, text } = await solanaRpc(body);
  return send(res, status, text);
}