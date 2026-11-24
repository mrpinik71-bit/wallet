import { trc20Balance } from "@/lib/chains/tron";
import { SCAN_ASSETS } from "@/lib/chains/scan-catalog";

// Proves the fix: a node that answers "quota exceeded" with HTTP 200 no longer
// reads as a zero balance — the next host answers the same call.
export default async function run() {
  const coin = SCAN_ASSETS.find((c) => c.id === "usdt-tron");
  const realFetch = globalThis.fetch;
  let servedError = false;
  globalThis.fetch = async (url, options) => {
    const text = String(url?.url || url);
    if (!servedError && text.includes("trongrid")) {
      servedError = true;
      return new Response(JSON.stringify({ Error: "quota exceeded" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return realFetch(url, options);
  };
  try {
    const balance = await trc20Balance("TAUN6FwrnwwmaEqYcckffC7wYmbaS6cBiX", coin);
    return { servedError, balance };
  } finally {
    globalThis.fetch = realFetch;
  }
}