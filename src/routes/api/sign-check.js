import { createFileRoute } from "@tanstack/react-router";
import bs58 from "bs58";
import { signSolanaTransfer } from "@/lib/chains/solana";
import { getAddresses } from "@/lib/chains/derive";

const MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const RAW = "https://solana-rpc.publicnode.com";

async function rpc(method, params) {
  const response = await fetch(RAW, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return response.json();
}

export const Route = createFileRoute("/api/sign-check")({
  server: {
    handlers: {
      GET: async () => {
        const addresses = getAddresses(MNEMONIC);
        const solTx = await signSolanaTransfer({
          mnemonic: MNEMONIC,
          to: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
          amount: 0.000005,
        });
        const bytes = bs58.decode(solTx);
        const strict = await rpc("simulateTransaction", [solTx, { encoding: "base58", sigVerify: true }]);
        const loose = await rpc("simulateTransaction", [solTx, { encoding: "base58", sigVerify: false }]);
        const account = await rpc("getAccountInfo", [addresses.solana, { encoding: "base64" }]);

        return Response.json({
          length: bytes.length,
          first: Array.from(bytes.slice(0, 5)),
          messageHeader: Array.from(bytes.slice(65, 71)),
          strict: strict.error || strict.result?.value?.err || strict.result?.value?.logs?.slice(-3) || null,
          loose: loose.error || loose.result?.value?.err || loose.result?.value?.logs?.slice(-3) || null,
          accountLamports: account.result?.value?.lamports ?? null,
          feePayer: bs58.encode(bytes.slice(66, 98)),
          expected: addresses.solana,
        });
      },
    },
  },
});