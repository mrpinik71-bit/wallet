// TRON balance reads on this deployment: TronGrid is called with the project's
// own TRONGRID_API_KEY. Without one, the read falls back to the app's relay.
import { send, tronRead } from "./_providers.js";

export default async function handler(req, res) {
  const query = { ...(req.query || {}) };
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? ""
      : typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body || {});

  const { status, text } = await tronRead(query, body);
  return send(res, status, text);
}