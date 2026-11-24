// Stacks balances on this deployment: Hiro is called with the project's own
// HIRO_API_KEY. Without one, the read falls back to the app's relay.
import { hiroBalances, send } from "./_providers.js";

export default async function handler(req, res) {
  const { status, text } = await hiroBalances({ ...(req.query || {}) });
  return send(res, status, text);
}