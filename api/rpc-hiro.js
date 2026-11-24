// Stacks balances on this deployment: Hiro is called with the project's own
// HIRO_API_KEY. Without one, the public Hiro endpoint is read.
import { hiroBalances, send } from "./_providers.js";

export default async function handler(req, res) {
  const { status, text } = await hiroBalances({ ...(req.query || {}) });
  return send(res, status, text);
}