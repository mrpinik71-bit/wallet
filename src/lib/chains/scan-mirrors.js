// Extra EVM endpoints the bulk scan spreads its batches over.
//
// Every endpoint here was checked from a browser against the scanner's real
// read pattern: a 40-call batch of balance requests, answered in full, with a
// CORS header that lets the page read it. That check matters — a public node
// that accepts one call but refuses a batch (most of the free "rpc" hosts do)
// would force the whole chain down to single calls, and the numbers in each
// comment are the widest batch actually answered.
//
// Each chain therefore lists its widest, most reliable nodes first and any
// narrower node last, where it is only reached when the wide ones fail. The
// chain's configured node in `chains` is added by the scanner as the final
// fallback, so no chain is left without a reader.
export const EVM_MIRRORS = {
  ethereum: [
    "https://eth-mainnet.public.blastapi.io", // 40
    "https://ethereum-rpc.publicnode.com", // 40
  ],
  bsc: [
    "https://bsc-mainnet.public.blastapi.io", // 40
    "https://bsc-dataseed.bnbchain.org", // 40
    "https://bsc-rpc.publicnode.com", // 40
  ],
  base: [
    "https://base-mainnet.public.blastapi.io", // 40
    "https://base-rpc.publicnode.com", // 40
    "https://mainnet.base.org", // 10
  ],
  arbitrum: [
    "https://arbitrum-one.public.blastapi.io", // 40
    "https://arb1.arbitrum.io/rpc", // 40
    "https://arbitrum-one-rpc.publicnode.com", // 40
  ],
  polygon: [
    "https://polygon.publicnode.com", // 40
    "https://polygon-bor-rpc.publicnode.com", // 40
  ],
  optimism: [
    "https://optimism-rpc.publicnode.com", // 40
    "https://1rpc.io/op", // 20
  ],
  avalanche: [
    "https://api.avax.network/ext/bc/C/rpc", // 40
    "https://avalanche-c-chain-rpc.publicnode.com", // 40
  ],
  linea: [
    "https://linea-rpc.publicnode.com", // 40
    "https://rpc.linea.build", // 40
  ],
  scroll: [
    "https://scroll-rpc.publicnode.com", // 40
    "https://scroll.rpc.thirdweb.com", // 20
  ],
  mantle: [
    "https://mantle-rpc.publicnode.com", // 40
    "https://rpc.mantle.xyz", // 20
  ],
  celo: [
    "https://forno.celo.org", // 40
    "https://celo-rpc.publicnode.com", // 40
  ],
  gnosis: [
    "https://gnosis-rpc.publicnode.com", // 40
    "https://rpc.gnosischain.com", // 40
  ],
  cronos: [
    "https://cronos-evm-rpc.publicnode.com", // 40
    "https://cronos.rpc.thirdweb.com", // 20
  ],
  sonic: ["https://sonic-rpc.publicnode.com"], // 40
  sei: [
    "https://evm-rpc.sei-apis.com", // 40
    "https://sei-evm-rpc.publicnode.com", // 40
  ],
  berachain: [
    "https://rpc.berachain.com", // 40
    "https://berachain-rpc.publicnode.com", // 40
  ],
  kava: [
    "https://evm.kava.io", // 40
    "https://kava-evm-rpc.publicnode.com", // 40
  ],
  unichain: [
    "https://unichain-rpc.publicnode.com", // 40
    "https://mainnet.unichain.org", // 10
  ],
  // The chain's own node answers the widest batches; the gateway mirror below
  // only ever earned a 429 at this width, so it is left out.
  zksync: [],
  polygonzkevm: [
    "https://zkevm-rpc.com", // 40
    "https://polygon-zkevm.rpc.thirdweb.com", // 20
  ],
  core: [
    "https://rpc.coredao.org", // 40
    "https://rpc.ankr.com/core", // 10
  ],
  fantom: ["https://1rpc.io/ftm"], // 40
  rootstock: ["https://mycrypto.rsk.co"], // 40
  citrea: ["https://rpc.citreascan.com"], // 40
  megaeth: ["https://megaeth.gateway.tenderly.co"], // 10
  bob: ["https://bob.gateway.tenderly.co"], // 10
};