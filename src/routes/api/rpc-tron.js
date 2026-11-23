import { createFileRoute } from "@tanstack/react-router";
import { secrets } from "base44:runtime";

// TronGrid, called with YOUR key — added here on the server, so the key is never
// part of the app's code or of anything the browser can read. The scan posts the
// same body it would send the public node and gets the node's answer.
const NODE = "https://api.trongrid.io";

// Only balance reads are relayed: this route is a wallet's reader, not a free
// general-purpose node, so nothing else a caller invents reaches your quota.
const OPS = {
  account: "/wallet/getaccount",
  call: "/wallet/triggerconstantcontract",
};

const MAX_BODY = 8 * 1024;

export const Route = createFileRoute("/api/rpc-tron")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = secrets.get("TRONGRID_API_KEY");
        if (!key) return Response.json({ error: "No TronGrid key configured." }, { status: 503 });

        const op = new URL(request.url).searchParams.get("op") || "";
        const path = OPS[op];
        if (!path) return Response.json({ error: "Unknown operation." }, { status: 400 });

        const body = await request.text();
        if (!body || body.length > MAX_BODY) return Response.json({ error: "Bad request." }, { status: 400 });

        const response = await fetch(`https://api.trongrid.io${path}`, {
          method: "POST",
          headers: { "content-type": "application/json", "TRON-PRO-API-KEY": key },
          body,
        });
        const text = await response.text();
        return new Response(text, {
          status: response.status,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
      },
    },
  },
});