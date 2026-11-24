// EVM reads on this deployment: dRPC is called with the project's own
// DRPC_API_KEY. Without one, each network's public node is read.
import { drpcRead, send } from "./_providers.js";

export default async function handler(req, res) {
  const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  const { status, text } = await drpcRead({ ...(req.query || {}) }, body);
  return send(res, status, text);
}