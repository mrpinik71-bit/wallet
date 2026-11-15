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
    "https://ethereum-rpc.publicnode.com", // 40
    "https://eth-mainnet.public.blastapi.io", // 40
    "https://ethereum.drpc.org", // 40
  ],
  bsc: [
    "https://bsc-dataseed.bnbchain.org", // 40
    "https://bsc-rpc.publicnode.com", // 40
    "https://bsc-mainnet.public.blastapi.io", // 40
    "https://bsc.drpc.org", // 40
  ],
  base: [
    "https://base-rpc.publicnode.com", // 40
    "https://base-mainnet.public.blastapi.io", // 40
    "https://base.drpc.org", // 40
    "https://mainnet.base.org", // 10
  ],
  arbitrum: [
    "https://arbitrum-one-rpc.publicnode.com", // 40
    "https://arb1.arbitrum.io/rpc", // 40
    "https://arbitrum-one.public.blastapi.io", // 40
    "https://arbitrum.drpc.org", // 40
  ],
  polygon: [
    "https://polygon-bor-rpc.publicnode.com", // 40
    "https://polygon.publicnode.com", // 40
    "https://polygon.drpc.org", // 40
  ],
  optimism: [
    "https://optimism-rpc.publicnode.com", // 40
    "https://optimism.drpc.org", // 40
    "https://1rpc.io/op", // 20
  ],
  avalanche: [
    "https://avalanche-c-chain-rpc.publicnode.com", // 40
    "https://api.avax.network/ext/bc/C/rpc", // 40
    "https://avalanche.drpc.org", // 40
  ],
  linea: [
    "https://linea-rpc.publicnode.com", // 40
    "https://rpc.linea.build", // 40
    "https://linea.drpc.org", // 40
  ],
  scroll: [
    "https://scroll-rpc.publicnode.com", // 40
    "https://scroll.rpc.thirdweb.com", // 20
    "https://scroll.drpc.org", // 40
  ],
  mantle: [
    "https://mantle-rpc.publicnode.com", // 40
    "https://rpc.mantle.xyz", // 20
    "https://mantle.drpc.org", // 40
  ],
  celo: [
    "https://celo-rpc.publicnode.com", // 40
    "https://forno.celo.org", // 40
    "https://celo.drpc.org", // 40
  ],
  gnosis: [
    "https://gnosis-rpc.publicnode.com", // 40
    "https://rpc.gnosischain.com", // 40
    "https://gnosis.drpc.org", // 40
  ],
  cronos: [
    "https://cronos-evm-rpc.publicnode.com", // 40
    "https://cronos.drpc.org", // 40
    "https://cronos.rpc.thirdweb.com", // 20
  ],
  sonic: [
    "https://sonic-rpc.publicnode.com", // 40
    "https://sonic.drpc.org", // 40
  ],
  sei: [
    "https://sei-evm-rpc.publicnode.com", // 40
    "https://evm-rpc.sei-apis.com", // 40
    "https://sei.drpc.org", // 40
  ],
  berachain: [
    "https://berachain-rpc.publicnode.com", // 40
    "https://rpc.berachain.com", // 40
  ],
  kava: [
    "https://kava-evm-rpc.publicnode.com", // 40
    "https://evm.kava.io", // 40
  ],
  unichain: [
    "https://unichain-rpc.publicnode.com", // 40
    "https://unichain.drpc.org", // 40
    "https://mainnet.unichain.org", // 10
  ],
  // The chain's own node answers the widest batches; the public gateway only
  // ever earned a 429 at this width, so a second wide gateway is used instead.
  zksync: ["https://zksync.drpc.org"], // 40
  // zkevm-rpc.com frequently answers 502, so it is the last resort now.
  polygonzkevm: [
    "https://polygon-zkevm.rpc.thirdweb.com", // 40
    "https://polygon-zkevm.drpc.org", // 40
    "https://zkevm-rpc.com", // 40 when it is up
  ],
  core: [
    "https://rpc.coredao.org", // 40
    "https://core.drpc.org", // 40
    "https://rpc.ankr.com/core", // 10
  ],
  fantom: [
    "https://fantom.drpc.org", // 40
    "https://rpcapi.fantom.network", // 40
  ],
  rootstock: [
    "https://mycrypto.rsk.co", // 40
    "https://public-node.rsk.co", // 40
  ],
  citrea: [
    "https://rpc.citreascan.com", // 40
    "https://rpc.mainnet.citrea.xyz", // 40
  ],
  megaeth: [
    "https://mainnet.megaeth.com/rpc", // 40
    "https://megaeth.drpc.org", // 40
    "https://megaeth.gateway.tenderly.co", // 10
  ],
  bob: [
    "https://rpc.gobob.xyz", // 40
    "https://bob.drpc.org", // 40
    "https://bob.gateway.tenderly.co", // 10
  ],
  merlin: [
    "https://rpc.merlinchain.io", // 40
    "https://merlin.drpc.org", // 40
  ],
};