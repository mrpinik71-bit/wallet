// Cardano balances on this deployment: read straight from the public Koios
// indexer (no key needed), with Blockfrost when a BLOCKFROST_PROJECT_ID is set.
import { cardanoBalances, send } from "./_providers.js";

export default async function handler(req, res) {
  const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  const { status, text } = await cardanoBalances(body);
  return send(res, status, text);
}