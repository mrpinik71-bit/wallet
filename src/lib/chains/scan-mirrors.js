// Extra EVM endpoints the bulk scan spreads its batches over.
//
// Every endpoint here was checked from a browser against the scanner's real
// read pattern: a 10-call JSON-RPC batch of balance requests, answered in full
// with the same number of results, and a CORS header that lets the page read it.
// That check matters — a public node that accepts one call but refuses a batch
// (most free gateways cap a batch at three calls and answer 400) would force the
// whole chain onto tiny batches, so no such gateway is listed. dRPC in
// particular is left out of the batch path for exactly this reason; its hosts
// remain fine for single-address reads elsewhere in the app.
//
// Each chain lists its widest, most reliable nodes first and any narrower node
// last, where it is only reached when the wide ones fail. The chain's configured
// node in `chains` is added by the scanner as the final fallback, so no chain is
// left without a reader.
export const EVM_MIRRORS = {
  ethereum: [
    "https://ethereum-rpc.publicnode.com", // 10
    "https://eth-mainnet.public.blastapi.io", // 10
    "https://gateway.tenderly.co/public/mainnet", // 20
  ],
  bsc: [
    "https://bsc-dataseed.bnbchain.org", // 10
    "https://bsc-rpc.publicnode.com", // 10
    "https://bsc-mainnet.public.blastapi.io", // 10
  ],
  base: [
    "https://base-rpc.publicnode.com", // 10
    "https://base-mainnet.public.blastapi.io", // 10
    "https://mainnet.base.org", // 10
  ],
  arbitrum: [
    "https://arbitrum-one-rpc.publicnode.com", // 10
    "https://arb1.arbitrum.io/rpc", // 10
    "https://arbitrum-one.public.blastapi.io", // 10
  ],
  polygon: [
    "https://polygon-bor-rpc.publicnode.com", // 10
    "https://polygon.publicnode.com", // 10
  ],
  optimism: [
    "https://optimism-rpc.publicnode.com", // 10
    "https://1rpc.io/op", // 10
  ],
  avalanche: [
    "https://avalanche-c-chain-rpc.publicnode.com", // 10
    "https://api.avax.network/ext/bc/C/rpc", // 10
  ],
  linea: [
    "https://linea-rpc.publicnode.com", // 10
    "https://rpc.linea.build", // 10
  ],
  scroll: [
    "https://scroll-rpc.publicnode.com", // 10
    "https://rpc.scroll.io", // 10
  ],
  mantle: [
    "https://mantle-rpc.publicnode.com", // 10
    "https://rpc.mantle.xyz", // 10
  ],
  celo: [
    "https://celo-rpc.publicnode.com", // 10
    "https://forno.celo.org", // 10
  ],
  gnosis: [
    "https://gnosis-rpc.publicnode.com", // 10
    "https://rpc.gnosischain.com", // 10
  ],
  cronos: [
    "https://cronos-evm-rpc.publicnode.com", // 10
    "https://evm.cronos.org", // 10
  ],
  sonic: ["https://sonic-rpc.publicnode.com"], // 10
  sei: [
    "https://sei-evm-rpc.publicnode.com", // 10
    "https://evm-rpc.sei-apis.com", // 10
  ],
  berachain: [
    "https://berachain-rpc.publicnode.com", // 10
    "https://rpc.berachain.com", // 10
  ],
  kava: [
    "https://kava-evm-rpc.publicnode.com", // 10
    "https://evm.kava.io", // 10
  ],
  unichain: [
    "https://unichain-rpc.publicnode.com", // 10
    "https://mainnet.unichain.org", // 10
  ],
  // The chain's own node is the only reader that answers a batch here; the free
  // gateways either refuse batches or are down, so they are not listed.
  zksync: ["https://mainnet.era.zksync.io"], // 10
  // zkevm-rpc.com answers when it is up and frequently answers 502, so the
  // chain's configured node is left as the fallback behind it.
  polygonzkevm: ["https://zkevm-rpc.com"], // 10
  core: [
    "https://rpc.coredao.org", // 10
    "https://rpc.ankr.com/core", // 10
  ],
  // The Fantom Foundation's own node; fantom-rpc.publicnode.com answers 404.
  fantom: ["https://rpcapi.fantom.network"], // 10
  rootstock: [
    "https://mycrypto.rsk.co", // 10
    "https://public-node.rsk.co", // 10
  ],
  citrea: [
    "https://rpc.citreascan.com", // 10
    "https://rpc.mainnet.citrea.xyz", // 10
  ],
  megaeth: [
    "https://mainnet.megaeth.com/rpc", // 10
    "https://megaeth.gateway.tenderly.co", // 10
  ],
  bob: [
    "https://rpc.gobob.xyz", // 10
    "https://bob.gateway.tenderly.co", // 10
  ],
  merlin: ["https://rpc.merlinchain.io"], // 10
};