// Bulk scan pipeline. Phrases are derived on this device, then every chain is
// asked about a whole batch of wallets at once: a batch of 20 wallets costs a
// few round trips per chain instead of a fresh set for each wallet, and the
// next batch is already in flight while the current one is answered.
import { chains } from "@/lib/chains/config";
import { customEndpoint } from "@/lib/chains/custom-rpc";
import { createDerivePool } from "@/lib/chains/derive-pool";
import { readBalance } from "@/lib/chains/portfolio";
import { priceOf } from "@/lib/chains/prices";
import { SCAN_ASSETS } from "@/lib/chains/scan-catalog";
import { colorForToken, discoverTokens } from "@/lib/chains/token-discovery";
import { prepare } from "@/lib/chains/scan-derive";
import { evmChainBalancesMany, resetBatching } from "@/lib/chains/scan-batch";
import { endpointsFor } from "@/lib/chains/mirrors";
import {
  cardanoBalancesMany,
  polkadotAssetBalancesMany,
  polkadotBalancesMany,
  solanaBalancesMany,
  solanaTokenBalancesMany,
  suiBalancesMany,
} from "@/lib/chains/scan-batch-multi";

// Small rounds: a wide batch is the first thing a free public node refuses, so
// wallets are grouped a few at a time. Many small rounds are kept in flight
// instead, so the scan still moves thousands of wallets at once — a refused
// small batch costs a handful of wallets, never a whole wall of them.
const CHUNK = 80; // wallets per batch round
// A phone cannot hold thousands of prepared wallets: every one carries a full
// address map, so a huge queue ran the tab out of memory and the scan stopped
// dead. The network lanes below are the real ceiling on speed, not this count.
// Each round fans out to every chain at once, so the number of rounds in flight
// is what decides the burst a node sees. Too many rounds and every read waits so
// long in its lane that the round looks stalled; this keeps the burst wide
// enough to be fast and small enough that reads actually land.
const INFLIGHT = 48; // batch rounds kept in flight
const MAX_WAITING = 800; // wallets prepared and waiting across all rounds — the memory ceiling
const READ_CHUNK = 40; // wallets handed to the network while the rest of the round is still being derived
// Starting burst for a node nobody has measured. A public node handed 500
// requests at once usually stops answering instead of refusing them, which read
// as a failed chain; a modest start that widens while the node keeps answering
// reaches the same width without that.
const PER_HOST = 240;
const MAX_CAP = 3600; // a node that keeps answering without a refusal may be widened this far
// A rate-limited node answers slowly when it answers at all, so a single read
// gets long enough to come back instead of being written off as a failed chain.
const JOB_TIMEOUT = 8000; // a stalled node must not hold a whole batch back
// A batched read first waits its turn in its node's own lane, so its clock is far
// longer than a single address read: timing it like one marked live chains as
// failed whenever the node was merely busy.
const SLOW_JOB_TIMEOUT = 14000;
// A node that keeps refusing is taken out for the rest of the run: otherwise a
// dead endpoint is waited on once per wallet, which stalls the whole scan.
// High enough that a burst of 429s never trips it, low enough that a dead node
// is dropped within the first few wallets instead of one try per wallet.
const DEAD_AFTER = 20;

// A whole batch must answer within this window. On a good connection a round
// takes a second or two; on a network where a handful of nodes simply never
// answer, the wallets are reported with what did come back instead of the round
// waiting minutes for the rest. This is what keeps the scan visibly moving.
const READ_DEADLINE = 25000;

// A read that never came back is still counted, so the row is honest about the
// chains that did not answer instead of showing them as empty.
const UNKNOWN_COIN = { id: "unread", chain: "unread", symbol: "unread", name: "No answer", color: "#6b7280" };

// Free endpoints with a published, low request budget: asking them faster only
// earns a 429, which used to be reported as a failed chain read.
const HOST_CAPS = {
  // Measured: these answer the burst below without a single 429, so they start
  // at twice the burst that was being used before.
  // Unregistered BlockCypher answers about three requests a second, so a wider
  // burst only earns a 429 for the whole DOGE/DASH group.
  "api.blockcypher.com": 4,
  // Dogecoin and Dash are read from these two explorers now; both answer a
  // steady burst, so they carry the whole group instead of BlockCypher.
  "chainz.cryptoid.info": 4,
  "sochain.com": 24,
  // Measured on a 500-wallet run: a wider burst earns a 429 here, and a
  // refusal costs the wallet its read, so these stay at the rate the node
  // actually serves.
  "mempool.space": 64,
  // Three more Esplora hosts serve the same Bitcoin read, so a wallet is asked
  // on whichever of the four is free instead of queueing behind one limit.
  "mempool.bitaroo.net": 64,
  "mempool.ninja": 64,
  "mempool.emzy.de": 64,
  "litecoinspace.org": 40,
  "fullnode.mainnet.aptoslabs.com": 8,
  "liquid.network": 8,
  "xrplcluster.com": 48,
  // XRP is served four ways; these start modest and widen while they answer.
  "xrpl.ws": 40,
  "s1.ripple.com:51234": 24,
  "s2.ripple.com:51234": 24,
  // Toncenter refuses a burst of five, but TonAPI takes the overflow, so the
  // pair together move many wallets at a time.
  "toncenter.com": 36,
  "tonapi.io": 36,
  // These refuse a wide burst: they start wide enough to matter, then a 429
  // halves them for the rest of the run instead of failing the read.
  "mempool.fractalbitcoin.io": 40,
  // Blockstream refuses a wide burst on the UTXO list Liquid needs — and every
  // wallet asks for it twice — so this one is kept narrow.
  // Blockstream refuses almost immediately — a single request past its budget
  // comes back 429 — so its lane is kept to a trickle.
  "blockstream.info": 3,
  // BOB's node rate-limits the tail of a wide batch without saying so, so its
  // requests are spaced out instead of arriving in one burst.
  "rpc.gobob.xyz": 4,
  // Hiro bans an address that goes over its window, so Stacks is served by two
  // hostnames at a trickle each instead of one wide burst.
  "api.mainnet.hiro.so": 8,
  "api.hiro.so": 8,
  "babylon-rest.publicnode.com": 32,
  "rpc.merlinchain.io": 36,
  "api.koios.rest": 20,
  "rpc.mainnet.near.org": 64,
  "api.trongrid.io": 40,
  "graphql.mainnet.sui.io": 48,
  // Gateways that serve many chains but reward a narrow burst; each widens on
  // its own while it keeps answering.
  "ethereum.drpc.org": 40,
  "bsc.drpc.org": 40,
  "base.drpc.org": 40,
  "arbitrum.drpc.org": 40,
  "polygon.drpc.org": 40,
  "optimism.drpc.org": 40,
  "avalanche.drpc.org": 40,
  "linea.drpc.org": 40,
  "scroll.drpc.org": 40,
  "mantle.drpc.org": 40,
  "celo.drpc.org": 40,
  "gnosis.drpc.org": 40,
  "cronos.drpc.org": 40,
  "sonic.drpc.org": 40,
  "sei.drpc.org": 40,
  "unichain.drpc.org": 40,
  "zksync.drpc.org": 32,
  "polygon-zkevm.drpc.org": 32,
  "core.drpc.org": 32,
  "fantom.drpc.org": 32,
  "megaeth.drpc.org": 32,
  "bob.drpc.org": 32,
  "merlin.drpc.org": 32,
  // Small L2 nodes: a burst that is too wide is simply read as a failed chain,
  // so these start narrow and widen only while they keep answering.
  "api.mainnet.abs.xyz": 16,
  "mainnet.megaeth.com": 16,
  "rpc.mainnet.citrea.xyz": 16,
  "rpc.citreascan.com": 16,
  "public-node.rsk.co": 16,
  "mycrypto.rsk.co": 16,
  "rpc-mainnet-1.geb.network": 16,
  "mainnet.era.zksync.io": 32,
  "rpcapi.fantom.network": 24,
  "zkevm-rpc.com": 16,
  "polygon-zkevm.rpc.thirdweb.com": 24,
  // Token lists answer one wallet at a time, so these stay narrower than a
  // batch read and widen only while the indexer keeps answering.
  "eth.blockscout.com": 36,
  "base.blockscout.com": 36,
  "api.binplorer.com": 20,
  "api.mainnet-beta.solana.com": 20,
  // One free Etherscan key allows five calls a second, and five networks are
  // discovered through it, so its lane stays at the key's own budget.
  "etherscan.io": 4,
  // Chains the free plan refuses: asked at a trickle, and rested once it is clear
  // the key does not cover them.
  "etherscan-paid": 2,
};

// Every measured host budget is widened by half again for this pass. The lane
// below that is the real ceiling: a node that refuses just narrows itself.
// Bitcoin-family and Stacks explorers are left at their measured value: a wider
// burst there earns a refusal instead of a faster answer, and a refused read is
// a wallet reported as unread.
const FRAGILE_HOSTS = new Set([
  "mempool.space",
  "mempool.bitaroo.net",
  "mempool.ninja",
  "mempool.emzy.de",
  "mempool.fractalbitcoin.io",
  "litecoinspace.org",
  "blockstream.info",
  "api.hiro.so",
  "api.mainnet.hiro.so",
  "chainz.cryptoid.info",
  "sochain.com",
  "api.blockcypher.com",
]);
for (const host of Object.keys(HOST_CAPS)) {
  if (HOST_CAPS[host] >= 8 && !FRAGILE_HOSTS.has(host)) HOST_CAPS[host] = Math.round(HOST_CAPS[host] * 1.5);
}

// Burst per host, tuned while the scan runs. Endpoints listed above start at
// their measured ceiling; the rest start at PER_HOST and are halved the first
// time they answer a 429, so extra lanes cost a single retry instead of a wall
// of refused requests.
let hostCaps = new Map();
let hostWins = new Map();
const capFor = (host) => hostCaps.get(host) ?? (HOST_CAPS[host] || PER_HOST);

/** A node that refused the burst is busy, not dead: lower its lanes, keep it. */
const isRateLimited = (error) =>
  error?.status === 429 || /\(429\)|\b429\b|too many requests|rate limit|busy/i.test(String(error?.message || error));
function lowerCap(host) {
  if (!host) return;
  const next = Math.max(2, Math.floor(capFor(host) / 2));
  hostCaps.set(host, next);
  // A busy node has not gone away, so this refusal must not count towards death.
  hostFailures.delete(host);
  hostWins.delete(host);
  // Already at its narrowest lane and still refusing: this node is out of
  // budget for now, not merely busy, so it rests instead of being asked once
  // per wallet for the rest of the scan.
  if (next <= 2) deadHosts.set(host, Date.now() + DEAD_MS);
}
// Assets are routed by how their chain can be asked: EVM chains per network,
// the multi-address chains together, everything else one wallet at a time.
const EVM_COINS = new Map();
const MULTI = { solana: [], sui: [], polkadot: [], cardano: [] };
const SOLO = [];
for (const coin of SCAN_ASSETS) {
  if (coin.family === "evm") {
    const list = EVM_COINS.get(coin.chain) || [];
    list.push(coin);
    EVM_COINS.set(coin.chain, list);
  } else if (MULTI[coin.chain]) {
    MULTI[coin.chain].push(coin);
  } else {
    SOLO.push(coin);
  }
}

// Token discovery: the catalog only holds the big tokens, so these five
// networks also report every other coin each wallet actually holds, one list
// per wallet, next to the catalog reads.
// The five networks whose indexer is behind a Cloudflare challenge are read
// through the app's own route, which asks Etherscan with a server-side key, so
// they all share one lane: the key's budget is what paces them, not the host.
const DISCOVERY_HOSTS = [
  ["ethereum", "etherscan.io"],
  ["arbitrum", "etherscan.io"],
  ["polygon", "etherscan.io"],
  // Base and Gnosis sit outside the free Etherscan plan. They share their own
  // lane, so the key's refusal there rests that lane instead of the working one
  // — and a paid key starts covering them with no code change.
  ["base", "etherscan-paid"],
  ["gnosis", "etherscan-paid"],
  ["optimism", "optimism.blockscout.com"],
  ["bsc", "api.binplorer.com"],
  ["solana", "api.mainnet-beta.solana.com"],
  ["ton", "tonapi.io"],
];
const DISCOVERY_LIMIT = 15; // tokens reported per network and wallet
// Catalog tokens are already read, so discovery only adds what is missing.
const CATALOG_TOKENS = new Set(
  SCAN_ASSETS.filter((coin) => coin.kind === "token" && coin.address).map(
    (coin) => `${coin.chain}|${coin.address.toLowerCase()}`,
  ),
);

// One Solana call answers SOL for every wallet, but an SPL token needs its own
// read per wallet, so the two are asked separately.
const SOLANA_NATIVE = MULTI.solana.filter((coin) => coin.kind !== "token");
const SOLANA_TOKENS = MULTI.solana.filter((coin) => coin.kind === "token");
// Sui and Polkadot keep their native coin on the batched reader; USDT and USDC
// there are a different coin type / a pallet-assets entry, so they are asked apart.
const SUI_NATIVE = MULTI.sui.filter((coin) => coin.kind !== "token");
const SUI_TOKENS = MULTI.sui.filter((coin) => coin.kind === "token");
const POLKADOT_NATIVE = MULTI.polkadot.filter((coin) => coin.kind !== "token");
const POLKADOT_TOKENS = MULTI.polkadot.filter((coin) => coin.kind === "token");

const hostOfUrl = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
};

// Dogecoin and Dash are read from their own explorer rather than the node in
// the chain config, so their requests are paced by that host's lane.
const READER_HOSTS = { dogecoin: "sochain.com", dash: "chainz.cryptoid.info" };

const hostOf = (chainId) => {
  // A node the user saved carries this chain, so its lanes are that node's own.
  const custom = customEndpoint(chainId);
  if (custom) return hostOfUrl(custom) || chainId;
  const chain = chains[chainId];
  const url = chain?.rpc || chain?.api || "";
  return READER_HOSTS[chainId] || hostOfUrl(url) || chainId;
};

// Public endpoints rate-limit bursts, so each host has its own request budget;
// the queues behind it never grow the number of open connections.
// A slot is released when the request is given up on, not when the network
// finally answers: a connection that never settles used to keep its slot for
// good, and once a lane's slots were all held that way every later request
// waited in its queue forever — the whole scan stopped without a single error.
const lanes = new Map();
function limit(host, run, cap = capFor(host), ms = 0) {
  const lane = lanes.get(host) || { active: 0, queue: [] };
  lanes.set(host, lane);
  return new Promise((resolve, reject) => {
    const start = () => {
      lane.active += 1;
      let settled = false;
      let timer = null;
      const done = () => {
        if (settled) return false;
        settled = true;
        if (timer) clearTimeout(timer);
        lane.active -= 1;
        const next = lane.queue.shift();
        if (next) next();
        return true;
      };
      const task = Promise.resolve().then(run);
      if (ms > 0) {
        timer = setTimeout(() => {
          if (done()) reject(new Error("This chain did not answer in time."));
        }, ms);
      }
      task.then(
        (value) => {
          if (done()) resolve(value);
        },
        (error) => {
          if (done()) reject(error);
        },
      );
    };
    if (lane.active < cap) start();
    else lane.queue.push(start);
  });
}

// Hosts that answered and hosts that gave up, for the scan that is running.
// A host that gave up is rested, not forgotten: after DEAD_MS it is asked again,
// so a chain that came back is never dropped for the rest of the run.
const DEAD_MS = 45000;
let deadHosts = new Map();
const hostFailures = new Map();

/** True while this host is resting; a host whose rest is over is trusted again. */
function hostDead(host) {
  const until = deadHosts.get(host);
  if (!until) return false;
  if (Date.now() < until) return true;
  deadHosts.delete(host);
  hostFailures.delete(host);
  return false;
}

/** Records whether a host answered, and drops it once it has clearly stopped. */
function noteHost(host, ok, weight = 1) {
  if (!host) return;
  if (ok) {
    hostFailures.delete(host);
    // A node that keeps answering clearly has headroom, so its lane is widened
    // step by step until it starts refusing — this is what turns the extra scan
    // lanes into real throughput instead of queued requests.
    const wins = (hostWins.get(host) || 0) + 1;
    hostWins.set(host, wins);
    // Widened every few answers instead of every 25, so a node reaches its real
    // width inside the first round instead of halfway through a long scan.
    if (wins % 10 === 0 && capFor(host) < MAX_CAP) {
      hostCaps.set(host, Math.min(MAX_CAP, capFor(host) + 6));
    }
    return;
  }
  const misses = (hostFailures.get(host) || 0) + weight;
  hostFailures.set(host, misses);
  if (misses >= DEAD_AFTER) deadHosts.set(host, Date.now() + DEAD_MS);
}

const withTimeout = (promise, ms) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("This chain did not answer in time.")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

const asCoinMap = (values, items, coins) => {
  const out = new Map();
  items.forEach((item, position) => {
    const value = values.get(position);
    if (value === undefined) return;
    out.set(item.index, new Map(coins.map((coin) => [coin.id, value])));
  });
  return out;
};

/** Reads every asset for a batch of wallets, batching wherever a chain allows it. */
async function readBatch(batch, onWallet, deep = true) {
  const jobs = [];
  const collect = (chainId, read) => {
    const items = [];
    batch.forEach((wallet, index) => {
      const address = wallet.addresses[chainId];
      if (address) items.push({ index, address });
    });
    if (items.length) jobs.push(read(items));
  };

  for (const [chainId, coins] of EVM_COINS) {
    collect(chainId, (items) => ({
      coins,
      targets: items.map((item) => item.index),
      host: hostOf(chainId),
      slow: true,
      run: async () => {
        const values = await evmChainBalancesMany(chainId, items.map((item) => item.address), coins);
        const out = new Map();
        items.forEach((item, position) => {
          const entry = values.get(position);
          if (entry) out.set(item.index, entry);
        });
        return out;
      },
    }));
  }

  if (SOLANA_NATIVE.length) {
    collect("solana", (items) => ({
      coins: SOLANA_NATIVE,
      targets: items.map((item) => item.index),
      host: hostOf("solana"),
      slow: true,
      run: async () => asCoinMap(await solanaBalancesMany(items.map((item) => item.address)), items, SOLANA_NATIVE),
    }));
  }

  for (const coin of SOLANA_TOKENS) {
    collect("solana", (items) => ({
      coins: [coin],
      targets: items.map((item) => item.index),
      // Batched like native SOL now, so the strict owner-lookup lane is gone.
      host: hostOf("solana"),
      slow: true,
      run: async () => {
        const values = await solanaTokenBalancesMany(
          items.map((item) => item.address),
          coin.address,
          coin.decimals,
        );
        const out = new Map();
        items.forEach((item, position) => {
          const amount = values.get(position);
          if (amount === undefined) return;
          out.set(item.index, new Map([[coin.id, amount]]));
        });
        return out;
      },
    }));
  }

  collect("sui", (items) => ({
    coins: SUI_NATIVE,
    targets: items.map((item) => item.index),
    host: hostOf("sui"),
    slow: true,
    run: async () => asCoinMap(await suiBalancesMany(items.map((item) => item.address)), items, SUI_NATIVE),
  }));

  collect("polkadot", (items) => ({
    coins: POLKADOT_NATIVE,
    targets: items.map((item) => item.index),
    host: hostOf("polkadot"),
    slow: true,
    run: async () => asCoinMap(await polkadotBalancesMany(items.map((item) => item.address)), items, POLKADOT_NATIVE),
  }));

  // USDT and USDC on Sui and Polkadot are their own batched read: a coin type on
  // Sui, a pallet-assets entry on Polkadot's Asset Hub.
  for (const coin of SUI_TOKENS) {
    collect("sui", (items) => ({
      coins: [coin],
      targets: items.map((item) => item.index),
      host: hostOf("sui"),
      slow: true,
      run: async () => {
        const values = await suiBalancesMany(items.map((item) => item.address), coin.address, coin.decimals);
        const out = new Map();
        items.forEach((item, position) => {
          const amount = values.get(position);
          if (amount === undefined) return;
          out.set(item.index, new Map([[coin.id, amount]]));
        });
        return out;
      },
    }));
  }

  for (const coin of POLKADOT_TOKENS) {
    collect("polkadot", (items) => ({
      coins: [coin],
      targets: items.map((item) => item.index),
      host: "asset-hub",
      slow: true,
      run: async () => {
        const values = await polkadotAssetBalancesMany(
          items.map((item) => item.address),
          coin.address,
          coin.decimals,
        );
        const out = new Map();
        items.forEach((item, position) => {
          const amount = values.get(position);
          if (amount === undefined) return;
          out.set(item.index, new Map([[coin.id, amount]]));
        });
        return out;
      },
    }));
  }

  if (MULTI.cardano.length) {
    const items = [];
    batch.forEach((wallet, index) => {
      if (wallet.cardano?.length) items.push({ index, addresses: wallet.cardano });
    });
    if (items.length) {
      jobs.push({
        coins: MULTI.cardano,
        targets: items.map((item) => item.index),
        host: hostOf("cardano"),
        slow: true,
        run: async () =>
          asCoinMap(
            await cardanoBalancesMany(items.map((item) => item.addresses)),
            items,
            MULTI.cardano,
          ),
      });
    }
  }

  // Chains that only answer for one address at a time still run in parallel,
  // within each host's own budget — and a chain with mirrors has its wallets
  // split across all of them, so the burst adds up instead of queueing on one.
  for (const coin of SOLO) {
    const items = [];
    batch.forEach((wallet, index) => {
      if (coin.chain === "ton" && wallet.words !== 24) return;
      const address = wallet.addresses[coin.chain];
      if (address) items.push({ index, address });
    });
    if (!items.length) continue;

    const endpoints = endpointsFor(coin.chain, chains[coin.chain]?.rpc || chains[coin.chain]?.api);
    // Two lanes per mirror: a single-address chain is asked on each of its
    // mirrors twice as often, so a round does not queue behind one lane each.
    const lanes = Math.min(Math.max(endpoints.length, 1) * 2, items.length);

    for (let lane = 0; lane < lanes; lane += 1) {
      const base = endpoints[lane % endpoints.length];
      // Round-robin, so every mirror gets an even share of the wallets.
      const slice = items.filter((_, position) => position % lanes === lane);
      const fallbacks = endpoints.filter((endpoint) => endpoint !== base);

      jobs.push({
        coins: [coin],
        targets: slice.map((item) => item.index),
        // Each single-address read takes its own slot on the host, so this group
        // must not take a second one for itself.
        inner: true,
        run: async () => {
          // A mirror that went quiet costs this slice nothing: the same wallets
          // are asked on the next endpoint that serves this chain. When every
          // endpoint of the chain is resting, the resting one is still asked —
          // a chain served by a single node must never be reported failed only
          // because that one node took a break.
          const order = [base, ...fallbacks];
          const live = order.filter((endpoint) => {
            const host = hostOfUrl(endpoint);
            return host && !hostDead(host);
          });
          for (const endpoint of live.length ? live : order) {
            const host = hostOfUrl(endpoint);
            if (!host) continue;
            const values = new Map();
            let refused = 0;
            await Promise.all(
              slice.map(async (item) => {
                // Timed out individually too: a node that never answers must not
                // hold this host's request slot for the rest of the scan. One
                // wallet failing is that wallet's failed read only, never the
                // whole chain for the batch.
                const balance = await limit(
                  host,
                  () => readBalance(coin, item.address, endpoint),
                  undefined,
                  JOB_TIMEOUT,
                ).catch((error) => {
                  // Refused because the burst was too wide: narrow this node's
                  // lanes and retry on the next round rather than counting it dead.
                  if (isRateLimited(error)) refused += 1;
                  globalThis.__scanErr ||= {};
                  const k = `${coin.chain}|${host}|${String(error?.message).slice(0, 70)}`;
                  globalThis.__scanErr[k] = (globalThis.__scanErr[k] || 0) + 1;
                  return undefined;
                });
                if (balance !== undefined) values.set(item.index, balance);
              }),
            );
            if (refused) lowerCap(host);
            // A node that refused every wallet of the group is not serving this
            // chain: counted as a loss, it is rested after a few rounds instead
            // of absorbing the whole scan in a wall of 429s.
            const lost = values.size
              ? Math.max(0, slice.length - values.size - refused)
              : Math.max(1, Math.ceil(slice.length / 4));
            noteHost(host, values.size > 0, lost);
            // This mirror is serving the group, so the answer stands.
            if (values.size) {
              return new Map([...values].map(([index, balance]) => [index, new Map([[coin.id, balance]])]));
            }
          }
          // No mirror answered: the job is retried as a whole instead of
          // reporting every wallet in this slice as a failed read.
          throw new Error(`${coin.chain} busy`);
        },
      });
    }
  }

  // Everything else held on the five discovery networks is looked up per wallet
  // and reported next to the catalog assets.
  // Deep scan: every other token a wallet holds, on the nine indexed networks.
  // The indexer's key allows a few calls a second and a wallet costs it several,
  // which is what makes a big scan slow; switched off, only the catalog assets
  // are read — all of them batched, so a round answers in a second or two.
  for (const [chainId, host] of deep ? DISCOVERY_HOSTS : []) {
    const items = [];
    batch.forEach((wallet, index) => {
      const address = wallet.addresses[chainId];
      if (address) items.push({ index, address });
    });
    if (!items.length) continue;

    jobs.push({
      coins: [],
      discover: chainId,
      targets: items.map((item) => item.index),
      host,
      // Every lookup takes its own slot on the host, so this group must not take
      // a second one for itself.
      inner: true,
      run: async () => {
        if (hostDead(host)) return new Map();
        const held = new Map();
        let refused = 0;
        await Promise.all(
          items.map(async (item) => {
            const tokens = await limit(host, () =>
              withTimeout(discoverTokens(chainId, item.address, DISCOVERY_LIMIT), JOB_TIMEOUT),
            ).catch((error) => {
              if (isRateLimited(error)) refused += 1;
              return undefined;
            });
            // An empty list is still an answer: this wallet holds no other coin.
            if (tokens) held.set(item.index, tokens);
          }),
        );
        if (refused) lowerCap(host);
        noteHost(host, held.size > 0, Math.max(0, items.length - held.size - refused));
        return held;
      },
    });
  }

  const reads = batch.map(() => []);
  const expected = batch.map(() => 0);
  for (const job of jobs) {
    // A discovery job answers once per wallet, however many tokens it finds.
    for (const index of job.targets) expected[index] += job.discover ? 1 : job.coins.length;
  }

  // A wallet is finished the moment every group that asked about it has
  // answered, so it is handed over right then instead of waiting for the whole
  // batch — the results list fills row by row while the scan keeps running.
  const reported = new Set();

  // A wallet is handed over the moment its own reads are in. It used to wait for
  // a per-wallet repair round of every failed read first, and with a handful of
  // nodes down that repair round took minutes per wallet — the scan showed
  // nothing at all while it retried. Each read already gets its own retries
  // above, so a chain that still failed is reported as failed and the screen
  // says so.
  // The round is closed only when it stops moving, not after a fixed clock: a
  // read that is waiting its turn in a busy node's lane has not failed, and
  // writing it off marked whole chains as failed whenever the scan was wide.
  // The clock restarts every time a wallet lands, so a slow but working round
  // always finishes; a round where nothing has landed for READ_DEADLINE is
  // closed with the answers that did arrive.
  let stalled = false;
  let stallTimer = null;
  let stallResolve = null;
  const stalledRun = new Promise((resolve) => {
    stallResolve = resolve;
  });
  const armStall = () => {
    if (stallTimer) clearTimeout(stallTimer);
    stallTimer = setTimeout(() => {
      stalled = true;
      stallResolve();
    }, READ_DEADLINE);
  };
  armStall();

  const finish = (index) => {
    if (reported.has(index) || reads[index].length < expected[index]) return;
    reported.add(index);
    onWallet?.(index, reads[index]);
    // Work landed: the round is alive, so its clock starts again.
    armStall();
  };
  batch.forEach((wallet, index) => {
    if (!expected[index]) finish(index);
  });

  // A busy public node often answers on a later try, so each group is retried
  // twice more before a wallet is marked as only partially read.
  const answered = Promise.all(
    jobs.map(async (job) => {
      let result;
      // A batched read waits in its host's queue first, so its clock starts only
      // when the request actually goes out — otherwise a busy node makes every
      // round look stalled while it was still waiting its turn.
      const budget = job.slow ? SLOW_JOB_TIMEOUT : JOB_TIMEOUT;
      const runOnce = job.inner
        ? () => job.run()
        : job.host
          ? () => limit(job.host, () => job.run(), job.cap, budget)
          : () => withTimeout(job.run(), budget);

      // A batched job rotates over several nodes of its own, so one resting node
      // must not stop the whole chain: only single-node jobs are held back.
      if (job.host && !job.slow && hostDead(job.host)) {
        // This node is resting; the job is asked again once its rest is over.
        result = { job, error: new Error(`${job.host} unavailable`) };
      } else {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            result = { job, values: await runOnce() };
            break;
          } catch (cause) {
            // A node that refused the wider burst keeps the next try on fewer
            // lanes instead of being marked as unavailable.
            if (isRateLimited(cause)) lowerCap(job.host);
            // A batched job that stalls is given two tries, not three: each one
            // costs the whole round its wait, and a node that missed the first
            // two is not going to answer the third.
            const tries = job.slow ? 2 : 3;
            if (attempt === tries - 1) {
              result = { job, error: cause };
              break;
            }
            // Rate-limited nodes need the burst to clear: back off, with a little
            // jitter so the retries do not all land at the same moment.
            await new Promise((resolve) => setTimeout(resolve, 220 * 2 ** attempt + Math.random() * 160));
          }
        }
        // Single-address jobs count their own host per request inside run().
        if (!job.inner) {
          const refused = isRateLimited(result.error);
          if (refused) lowerCap(job.host);
          // A batched node that failed lost a whole round of wallets, not one
          // address, so it counts for more when deciding to let it rest.
          noteHost(job.host, !result.error, refused ? 0 : job.slow ? 6 : 1);
        }
      }

      for (const index of job.targets) {
        if (job.discover) {
          const tokens = result.error ? [] : result.values.get(index) || [];
          const listed = tokens.filter(
            (token) => token.address && !CATALOG_TOKENS.has(`${job.discover}|${String(token.address).toLowerCase()}`),
          );
          for (const token of listed) {
            reads[index].push({
              coin: {
                id: `token-${job.discover}-${token.address}`,
                chain: job.discover,
                symbol: token.symbol,
                name: token.name,
                color: colorForToken(token.symbol),
                logo: token.logo,
              },
              balance: token.balance,
              failed: false,
            });
          }
          // Discovery answers once per wallet, so an empty list still satisfies
          // that wallet's expected reads.
          if (!listed.length) reads[index].push({ coin: null, balance: 0, failed: false });
          finish(index);
          continue;
        }
        if (result.error) {
          for (const coin of job.coins) reads[index].push({ coin, balance: 0, failed: true });
        } else {
          const entry = result.values.get(index);
          for (const coin of job.coins) {
            const balance = entry ? entry.get(coin.id) : undefined;
            reads[index].push({ coin, balance: balance ?? 0, failed: balance === undefined });
          }
        }
        finish(index);
      }
    }),
  );

  // The round is closed once it stops moving: every wallet still waiting is
  // reported with what came back, and a read that lands after this is ignored
  // instead of holding the whole scan at a standstill.
  await Promise.race([answered, stalledRun]);
  if (stallTimer) clearTimeout(stallTimer);
  if (stalled) {
    batch.forEach((wallet, index) => {
      if (reported.has(index)) return;
      const missing = Math.max(0, expected[index] - reads[index].length);
      for (let slot = 0; slot < missing; slot += 1) {
        reads[index].push({ coin: UNKNOWN_COIN, balance: 0, failed: true });
      }
      reported.add(index);
      onWallet?.(index, reads[index]);
    });
  }

  return reads;
}

function toResult(wallet, reads, prices) {
  const funded = reads
    .filter((read) => read.balance > 0)
    .map((read) => ({
      id: read.coin.id,
      chain: read.coin.chain,
      symbol: read.coin.symbol,
      name: read.coin.name,
      color: read.coin.color,
      logo: read.coin.logo,
      balance: read.balance,
      value: read.balance * priceOf(prices, read.coin),
    }))
    .sort((a, b) => b.value - a.value);

  const failedReads = reads.filter((read) => read.failed);

  return {
    phrase: wallet.entry.phrase,
    words: wallet.words,
    // 0 is the phrase's first wallet; 1 and 2 are its second and third accounts.
    account: wallet.account || 0,
    line: wallet.entry.line,
    addresses: wallet.addresses,
    funded,
    total: funded.reduce((sum, item) => sum + item.value, 0),
    failed: failedReads.length,
    failedChains: [...new Set(failedReads.map((read) => read.coin.symbol))],
    status: "done",
    error: null,
  };
}

/** Scans phrases as they stream in, in batches, reporting each wallet as it lands. */
export async function scanPhrases(source, { prices, onResult, onProgress, isCancelled, accounts, deep = true } = {}) {
  // One phrase can hold several accounts: each account index is derived and
  // checked as its own wallet, so funds on account 2 or 3 are found too.
  const accountsPerPhrase = Math.max(1, Math.min(3, accounts || 1));
  // Every run starts with every node trusted again, at its full starting burst.
  deadHosts = new Map();
  hostFailures.clear();
  hostCaps = new Map();
  hostWins = new Map();
  // Batched reads go back to full groups and their nodes to full request lanes.
  resetBatching();
  let completed = 0;
  let started = 0;
  let batchNumber = 0;
  const active = new Set();
  let buffer = [];

  const report = (result) => {
    completed += 1;
    onResult?.(result);
    onProgress?.({ completed, started, result });
  };

  // Without worker threads a phrase is derived on this thread, yielding often
  // enough that the page keeps painting.
  const prepareInline = async (entries, onWallet) => {
    for (let position = 0; position < entries.length; position += 1) {
      if (isCancelled?.()) break;
      onWallet?.(position, prepare(entries[position]));
      // A phrase takes a phone a good fraction of a second to derive, so the
      // thread is handed back every couple of phrases: the page keeps painting.
      if (position % 2 === 1) await new Promise((resolve) => setTimeout(resolve, 0));
    }
  };

  // Derivation, spread over every core of the device for this whole scan.
  const pool = createDerivePool();
  // Reported up front: one core means the device refused worker threads and every
  // phrase is being derived on this thread, which is worth seeing on screen.
  onProgress?.({ completed, started, cores: pool?.size || 1 });

  const runBatch = async (entries, batch) => {
    // Announced before the reads start, so the page shows wallets being checked
    // while they are still being derived — with the batch they belong to.
    started += entries.length;
    onProgress?.({ completed, started, batch, cores: pool ? pool.alive() : 1 });

    // Deriving and reading overlap: as soon as READ_CHUNK wallets are derived
    // they go to the network while the rest of the round is still deriving, so
    // the device's cores and the connections are busy at the same time instead
    // of taking turns. Every derived wallet still ends up in exactly one read.
    const pending = [];
    const reads = [];
    const handOver = () => {
      if (!pending.length) return;
      const part = pending.splice(0, pending.length);
      reads.push(
        readBatch(part, (index, walletReads) => report(toResult(part[index], walletReads, prices)), deep),
      );
    };

    let handoverTimer = null;

    const take = (position, wallet) => {
      if (!wallet || isCancelled?.()) return;
      const entry = entries[position];
      if (wallet.invalid) {
        report({
          phrase: entry.phrase,
          words: entry.words,
          account: wallet.account || 0,
          line: entry.line,
          addresses: {},
          funded: [],
          total: 0,
          failed: 0,
          status: "invalid",
          error: wallet.error,
        });
        return;
      }
      pending.push(wallet);
      if (pending.length >= READ_CHUNK) {
        handOver();
      } else if (!handoverTimer) {
        // The first wallets go to the network on their own, a moment after they
        // arrive: waiting for a full group kept the screen at zero for as long as
        // that whole group took to derive, which read as a frozen scan.
        handoverTimer = setTimeout(() => {
          handoverTimer = null;
          handOver();
        }, 1000);
      }
    };

    if (pool) await pool.map(entries, isCancelled, take);
    else await prepareInline(entries, take);

    if (handoverTimer) {
      clearTimeout(handoverTimer);
      handoverTimer = null;
    }

    handOver();
    // Each wallet is reported as soon as its own chains have answered.
    await Promise.all(reads);
  };

  // A prepared wallet holds a full address map, so the queue is capped by how
  // many wallets are waiting as well as by how many rounds are running: without
  // that bound the bigger round size would exhaust the tab instead of going faster.
  let waiting = 0;
  const launch = (entries) => {
    let task;
    batchNumber += 1;
    const batch = { number: batchNumber, from: started + 1, to: started + entries.length, size: entries.length };
    waiting += entries.length;
    task = runBatch(entries, batch).finally(() => {
      waiting -= entries.length;
      active.delete(task);
    });
    active.add(task);
  };

  for await (const entry of source) {
    if (isCancelled?.()) break;
    for (let account = 0; account < accountsPerPhrase; account += 1) {
      buffer.push(account ? { ...entry, account } : entry);
      if (buffer.length >= CHUNK) {
        launch(buffer);
        buffer = [];
        if (active.size >= INFLIGHT || waiting >= MAX_WAITING) await Promise.race(active);
      }
    }
  }
  if (buffer.length && !isCancelled?.()) launch(buffer);
  await Promise.all(active);
  pool?.close();
}