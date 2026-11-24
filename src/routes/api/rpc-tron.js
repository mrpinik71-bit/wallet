import { createFileRoute } from "@tanstack/react-router";
import { askKeys, readOnce, relay } from "@/lib/relay-keys.server";

// TronGrid, called with YOUR keys — added here on the server, so they are never
// part of the app's code or of anything the browser can read. The scan posts the
// same body it would send the public node and gets the node's answer.
//
// TRONGRID_API_KEY may hold several keys separated by commas or spaces: a busy
// key is rested and the next one carries the read, and the keyless public node
// answers when none is left — so a Tron read never ends as failed over a key.
const NODE = "https://api.trongrid.io";

// Only balance reads are relayed: this route is a wallet's reader, not a free
// general-purpose node, so nothing else a caller invents reaches your quota.
const OPS = {
  account: "/wallet/getaccount",
  call: "/wallet/triggerconstantcontract",
};

const MAX_BODY = 8 * 1024;

// TronGrid answers an empty object for an address it has never seen: that is a
// real answer (a wallet holding nothing), so only a named error counts as one.
const usable = (text) => {
  if (!text) return false;
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== "object") return true;
    return !body.Error && !body.error;
  } catch {
    return false;
  }
};

export const Route = createFileRoute("/api/rpc-tron")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const op = new URL(request.url).searchParams.get("op") || "";
        const path = OPS[op];
        if (!path) return Response.json({ error: "Unknown operation." }, { status: 400 });

        const body = await request.text();
        if (!body || body.length > MAX_BODY) return Response.json({ error: "Bad request." }, { status: 400 });

        const answer = await askKeys(
          "TRONGRID_API_KEY",
          (key) =>
            readOnce(`${NODE}${path}`, {
              method: "POST",
              headers: { "content-type": "application/json", "TRON-PRO-API-KEY": key },
              body,
            }),
          usable,
        );
        if (answer.status >= 200 && answer.status < 300 && usable(answer.text)) return relay(answer);

        // Every key refused: the public node carries the read, and the app's own
        // indexer fallback still stands behind it.
        const fallback = await readOnce(`${NODE}${path}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
        });
        return relay(fallback || answer);
      },
    },
  },
});