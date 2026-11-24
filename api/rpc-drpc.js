// EVM reads on this deployment: dRPC is called with the project's own
// DRPC_API_KEY. Without one, the read falls back to the app's relay.
import { drpcRead, send } from "./_providers.js";

export default async function handler(req, res) {
  const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  const { status, text } = await drpcRead({ ...(req.query || {}) }, body);
  return send(res, status, text);
}