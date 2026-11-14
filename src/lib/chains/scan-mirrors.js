// Extra EVM endpoints the bulk scan spreads its batches over.
//
// A public node answers a couple of large JSON-RPC batches and then refuses
// everything for a while, which used to make a chain look unreadable halfway
// through a scan. Every endpoint here was checked to accept batched reads from
// a browser and to answer several hundred wallets in a row, so a scan rotates
// its batches across them instead of queueing everything on one node.
//
// This map is for scanning only: the wallet's own reads keep using the single
// endpoint configured in `chains`.
export const EVM_MIRRORS = {
  ethereum: ["https://eth-mainnet.public.blastapi.io"],
  bsc: ["https://bsc-mainnet.public.blastapi.io", "https://bsc-dataseed.bnbchain.org"],
  base: ["https://base-mainnet.public.blastapi.io", "https://mainnet.base.org"],
  arbitrum: ["https://arbitrum-one.public.blastapi.io", "https://arb1.arbitrum.io/rpc"],
  polygon: ["https://polygon.drpc.org"],
  optimism: ["https://mainnet.optimism.io"],
  avalanche: ["https://api.avax.network/ext/bc/C/rpc"],
  linea: ["https://rpc.linea.build"],
  scroll: ["https://rpc.scroll.io"],
  mantle: ["https://rpc.mantle.xyz"],
  celo: ["https://forno.celo.org"],
  gnosis: ["https://rpc.gnosischain.com"],
  cronos: ["https://evm.cronos.org"],
  sonic: ["https://rpc.soniclabs.com"],
  sei: ["https://evm-rpc.sei-apis.com"],
  berachain: ["https://rpc.berachain.com"],
  kava: ["https://evm.kava.io"],
  unichain: ["https://mainnet.unichain.org"],
};