// Token discovery on this deployment: Etherscan V2 is called with the project's
// own ETHERSCAN_API_KEY. Without one, the read falls back to the app's relay.
import { send, tokenDiscovery } from "./_providers.js";

export default async function handler(req, res) {
  const { status, text } = await tokenDiscovery({ ...(req.query || {}) });
  return send(res, status, text);
}