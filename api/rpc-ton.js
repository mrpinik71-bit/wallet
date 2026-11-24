// TON balance reads on this deployment: Toncenter is called with the project's
// own TONCENTER_API_KEY. Without one, the read falls back to the app's relay.
import { send, tonBalance } from "./_providers.js";

export default async function handler(req, res) {
  const { status, text } = await tonBalance(req.query || {});
  return send(res, status, text);
}