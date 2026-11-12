import { createFileRoute } from "@tanstack/react-router";
import { loadPortfolio } from "@/lib/chains/portfolio";
import { estimateFee, sendAsset, validateAddress } from "@/lib/chains/send";
import { coinById } from "@/lib/chains/config";

const MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

export const Route = createFileRoute("/api/chain-check")({
  server: {
    handlers: {
      GET: async () => {
        const started = Date.now();
        const portfolio = await loadPortfolio(MNEMONIC);
        const fees = {};
        for (const coinId of ["bitcoin", "litecoin", "ethereum", "solana", "tron"]) {
          const coin = coinById(coinId);
          try {
            fees[coinId] = await estimateFee({ coin, mnemonic: MNEMONIC, to: "", amount: "0.001" });
          } catch (error) {
            fees[coinId] = error.message;
          }
        }
        return Response.json({
          ms: Date.now() - started,
          addresses: portfolio.addresses,
          total: portfolio.total,
          errors: portfolio.holdings.filter((row) => row.error).map((row) => `${row.id}: ${row.error}`),
          balances: portfolio.holdings
            .filter((row) => row.balance > 0)
            .map((row) => `${row.symbol} ${row.balance}`),
          fees,
          validation: {
            badEth: validateAddress(coinById("ethereum"), "0x123"),
            badBtc: validateAddress(coinById("bitcoin"), "0x123"),
            goodEth: validateAddress(coinById("ethereum"), "0x9858EfFD232B4033E47d90003D41EC34EcaEda94"),
            sendGuard: await sendAsset({ coin: coinById("ethereum"), mnemonic: MNEMONIC, to: "0x123", amount: "1" }).catch(
              (error) => `blocked: ${error.message}`,
            ),
          },
        });
      },
    },
  },
});