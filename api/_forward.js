// Every chain reader the app needs a provider key for lives in one Base44 backend
// function (`chainRelay`), where the keys already are. These functions forward to
// it, so the Vercel deployment serves the same /api paths as the Base44 host
// without holding any key of its own — and without any project setup.
const RELAY = "https://glorious-vault-chain-core.base44.app/functions/chainRelay";

export default function forward(provider) {
  return async function handler(req, res) {
    const query = {};
    for (const [name, value] of Object.entries(req.query || {})) {
      if (name === "provider" || value === undefined) continue;
      query[name] = Array.isArray(value) ? String(value[0]) : String(value);
    }

    const envelope = {
      provider,
      query,
      body:
        req.method === "GET" || req.method === "HEAD"
          ? ""
          : typeof req.body === "string"
            ? req.body
            : JSON.stringify(req.body || {}),
    };

    try {
      const response = await fetch(RELAY, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(envelope),
      });
      const text = await response.text();
      res.status(response.status);
      res.setHeader("content-type", response.headers.get("content-type") || "application/json");
      res.setHeader("cache-control", "no-store");
      return res.send(text);
    } catch {
      return res.status(502).json({ error: "Chain reader unavailable." });
    }
  };
}