// Bulk scan pipeline. Phrases are derived on this device, then every chain is
// asked about a whole batch of wallets at once: a batch of 20 wallets costs a
// few round trips per chain instead of a fresh set for each wallet, and the
// next batch is already in flight while the current one is answered.
import { cardanoAddresses } from "@/lib/chains/cardano";
import { chains } from "@/lib/chains/config";
import { evmAddress, getAddresses } from "@/lib/chains/derive";
import { readBalance } from "@/lib/chains/portfolio";
import { priceOf } from "@/lib/chains/prices";
import { SCAN_ASSETS } from "@/lib/chains/scan-catalog";
import { evmChainBalancesMany } from "@/lib/chains/scan-batch";
import {
  cardanoBalancesMany,
  polkadotBalancesMany,
  solanaBalancesMany,
  solanaTokenBalancesMany,
  suiBalancesMany,
} from "@/lib/chains/scan-batch-multi";

const CHUNK = 40; // wallets per batch round — bigger rounds mean far fewer round trips per wallet
const INFLIGHT = 178; // batch rounds kept in flight — 50 more parallel round-trips on top of the last raise
const PER_HOST = 60; // starting burst per endpoint; a 429 halves it for that node for the rest of the run
const JOB_TIMEOUT = 7000; // a stalled node must not hold a whole batch back
// A node that keeps refusing is taken out for the rest of the run: otherwise a
// dead endpoint is waited on once per wallet, which stalls the whole scan.
// High enough that a burst of 429s never trips it, low enough that a dead node
// is dropped within the first few wallets instead of one try per wallet.
const DEAD_AFTER = 30;

// Free endpoints with a published, low request budget: asking them faster only
// earns a 429, which used to be reported as a failed chain read.
const HOST_CAPS = {
  // Measured: these answer the burst below without a single 429.
  "api.blockcypher.com": 24,
  "mempool.space": 34,
  "litecoinspace.org": 16,
  "fullnode.mainnet.aptoslabs.com": 24,
  "xrplcluster.com": 18,
  // Toncenter refuses a burst of five, but TonAPI takes the overflow, so the
  // pair together move many wallets at a time.
  "toncenter.com": 12,
  "tonapi.io": 12,
  // Still strict: these start refusing a burst of ten.
  "mempool.fractalbitcoin.io": 12,
  "blockstream.info": 6,
  "api.mainnet.hiro.so": 8,
  "babylon-rest.publicnode.com": 8,
  "rpc.merlinchain.io": 10,
  "api.koios.rest": 5,
  "rpc.mainnet.near.org": 16,
  "api.trongrid.io": 6,
  "graphql.mainnet.sui.io": 10,
  "api.mainnet-beta.solana.com": 8,
};

// Burst per host, tuned while the scan runs. Endpoints listed above start at
// their measured ceiling; the rest start at PER_HOST and are halved the first
// time they answer a 429, so extra lanes cost a single retry instead of a wall
// of refused requests.
let hostCaps = new Map();
const capFor = (host) => hostCaps.get(host) ?? (HOST_CAPS[host] || PER_HOST);

/** A node that refused the burst is busy, not dead: lower its lanes, keep it. */
const isRateLimited = (error) => /\(429\)|too many requests|rate limit/i.test(String(error?.message || error));
function lowerCap(host) {
  if (!host) return;
  hostCaps.set(host, Math.max(2, Math.floor(capFor(host) / 2)));
  // A busy node has not gone away, so this refusal must not count towards death.
  hostFailures.delete(host);
}
const WORD_COUNTS = [12, 15, 18, 21, 24];

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

// One Solana call answers SOL for every wallet, but an SPL token needs its own
// read per wallet, so the two are asked separately.
const SOLANA_NATIVE = MULTI.solana.filter((coin) => coin.kind !== "token");
const SOLANA_TOKENS = MULTI.solana.filter((coin) => coin.kind === "token");

const hostOf = (chainId) => {
  const chain = chains[chainId];
  const url = chain?.rpc || chain?.api || "";
  try {
    return new URL(url).host;
  } catch {
    return chainId;
  }
};

// Public endpoints rate-limit bursts, so each host has its own request budget;
// the queues behind it never grow the number of open connections.
const lanes = new Map();
function limit(host, run, cap = capFor(host)) {
  const lane = lanes.get(host) || { active: 0, queue: [] };
  lanes.set(host, lane);
  return new Promise((resolve, reject) => {
    const start = () => {
      lane.active += 1;
      Promise.resolve()
        .then(run)
        .then(resolve, reject)
        .finally(() => {
          lane.active -= 1;
          const next = lane.queue.shift();
          if (next) next();
        });
    };
    if (lane.active < cap) start();
    else lane.queue.push(start);
  });
}

// Hosts that answered and hosts that gave up, for the scan that is running.
let deadHosts = new Set();
const hostFailures = new Map();

/** Records whether a host answered, and drops it once it has clearly stopped. */
function noteHost(host, ok, weight = 1) {
  if (!host) return;
  if (ok) {
    hostFailures.delete(host);
    return;
  }
  const misses = (hostFailures.get(host) || 0) + weight;
  hostFailures.set(host, misses);
  if (misses >= DEAD_AFTER) deadHosts.add(host);
}

/** Derives every address this phrase controls, on this device. */
function prepare(entry) {
  // Any standard length is accepted — a phrase is never dropped just because it
  // differs from the selector, so every real phrase gets derived and checked.
  const size = entry.phrase.trim().split(/\s+/).filter(Boolean).length;
  if (!WORD_COUNTS.includes(size)) {
    return { invalid: true, error: "A recovery phrase has 12, 15, 18, 21 or 24 words." };
  }

  let addresses = {};
  try {
    addresses = getAddresses(entry.phrase);
  } catch {
    // One chain failing to derive must not hide the wallet: the EVM address
    // alone still shows funds on every EVM network.
    try {
      addresses = { ethereum: evmAddress(entry.phrase) };
    } catch {
      return { invalid: true, error: "Addresses could not be derived from this phrase." };
    }
  }

  // No address at all means nothing could be checked — say so instead of
  // reporting an empty wallet as if it had been scanned.
  if (!Object.keys(addresses).length) {
    return { invalid: true, error: "Addresses could not be derived from this phrase." };
  }

  let cardano = [];
  try {
    cardano = cardanoAddresses(entry.phrase);
  } catch {
    cardano = [];
  }

  return { entry, words: size, addresses, cardano };
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
async function readBatch(batch, onWallet) {
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
      run: async () => asCoinMap(await solanaBalancesMany(items.map((item) => item.address)), items, SOLANA_NATIVE),
    }));
  }

  for (const coin of SOLANA_TOKENS) {
    collect("solana", (items) => ({
      coins: [coin],
      targets: items.map((item) => item.index),
      // Batched like native SOL now, so the strict owner-lookup lane is gone.
      host: hostOf("solana"),
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
    coins: MULTI.sui,
    targets: items.map((item) => item.index),
    host: hostOf("sui"),
    run: async () => asCoinMap(await suiBalancesMany(items.map((item) => item.address)), items, MULTI.sui),
  }));

  collect("polkadot", (items) => ({
    coins: MULTI.polkadot,
    targets: items.map((item) => item.index),
    host: hostOf("polkadot"),
    run: async () => asCoinMap(await polkadotBalancesMany(items.map((item) => item.address)), items, MULTI.polkadot),
  }));

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
  // within each host's own budget.
  for (const coin of SOLO) {
    const items = [];
    batch.forEach((wallet, index) => {
      if (coin.chain === "ton" && wallet.words !== 24) return;
      const address = wallet.addresses[coin.chain];
      if (address) items.push({ index, address });
    });
    if (!items.length) continue;

    const host = hostOf(coin.chain);
    jobs.push({
      coins: [coin],
      targets: items.map((item) => item.index),
      // Each single-address read takes its own slot on the host, so this group
      // must not take a second one for itself.
      inner: true,
      run: async () => {
        // A host this scan already gave up on is not asked again: its wallets are
        // reported as failed reads instead of waiting on it one by one.
        if (deadHosts.has(host)) return new Map();
        const values = new Map();
        let refused = 0;
        await Promise.all(
          items.map(async (item) => {
            // Timed out individually too: a node that never answers must not hold
            // this host's request slot for the rest of the scan. One wallet failing
            // is that wallet's failed read only, never the whole chain for the batch.
            const balance = await limit(host, () => withTimeout(readBalance(coin, item.address), JOB_TIMEOUT)).catch(
              (error) => {
                // Refused because the burst was too wide: narrow this node's lanes
                // and retry on the next round rather than counting it as dead.
                if (isRateLimited(error)) refused += 1;
                return undefined;
              },
            );
            values.set(item.index, balance);
          }),
        );
        // A whole group with no answer means the host itself is down, so it counts
        // once per wallet and is dropped from the rest of the scan straight away.
        const answered = [...values.values()].filter((value) => value !== undefined).length;
        if (refused) lowerCap(host);
        noteHost(host, answered > 0, Math.max(0, items.length - answered - refused));
        // A host that refused every wallet is a busy node rather than empty
        // wallets, so the job is retried as a whole instead of reporting failures.
        if ([...values.values()].every((value) => value === undefined)) throw new Error(`${coin.chain} busy`);
        return new Map([...values].map(([index, balance]) => [index, new Map([[coin.id, balance]])]));
      },
    });
  }

  const reads = batch.map(() => []);
  const expected = batch.map(() => 0);
  for (const job of jobs) {
    for (const index of job.targets) expected[index] += job.coins.length;
  }

  // A wallet is finished the moment every group that asked about it has
  // answered, so it is handed over right then instead of waiting for the whole
  // batch — the results list fills row by row while the scan keeps running.
  const reported = new Set();
  const finish = (index) => {
    if (reported.has(index) || reads[index].length < expected[index]) return;
    reported.add(index);
    onWallet?.(index, reads[index]);
  };
  batch.forEach((wallet, index) => {
    if (!expected[index]) finish(index);
  });

  // A busy public node often answers on a later try, so each group is retried
  // twice more before a wallet is marked as only partially read.
  await Promise.all(
    jobs.map(async (job) => {
      let result;
      // A batched read waits in its host's queue first, so its clock starts only
      // when the request actually goes out — otherwise a busy node makes every
      // round look stalled while it was still waiting its turn.
      const runOnce = job.inner
        ? () => job.run()
        : job.host
          ? () => limit(job.host, () => withTimeout(job.run(), JOB_TIMEOUT), job.cap)
          : () => withTimeout(job.run(), JOB_TIMEOUT);

      if (job.host && deadHosts.has(job.host)) {
        // Already given up on this node earlier in the run.
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
            if (attempt === 2) result = { job, error: cause };
            // Rate-limited nodes need the burst to clear: back off, with a little
            // jitter so the retries do not all land at the same moment.
            else await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt + Math.random() * 300));
          }
        }
        // Single-address jobs count their own host per request inside run().
        if (!job.inner) {
          const refused = isRateLimited(result.error);
          if (refused) lowerCap(job.host);
          noteHost(job.host, !result.error, refused ? 0 : 1);
        }
      }

      for (const index of job.targets) {
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
    line: wallet.entry.line,
    addresses: wallet.addresses,
    funded,
    total: funded.reduce((sum, item) => sum + item.value, 0),
    failed: failedReads.length,
    failedChains: failedReads.map((read) => read.coin.symbol),
    status: "done",
    error: null,
  };
}

/** Scans phrases as they stream in, in batches, reporting each wallet as it lands. */
export async function scanPhrases(source, { prices, onResult, onProgress, isCancelled } = {}) {
  // Every run starts with every node trusted again, at its full starting burst.
  deadHosts = new Set();
  hostFailures.clear();
  hostCaps = new Map();
  let completed = 0;
  let started = 0;
  const active = new Set();
  let buffer = [];

  const report = (result) => {
    completed += 1;
    onResult?.(result);
    onProgress?.({ completed, started, result });
  };

  const runBatch = async (entries) => {
    // Announced before the reads start, so the page shows wallets being checked
    // while a slow node is still answering.
    started += entries.length;
    onProgress?.({ completed, started });

    const batch = [];
    for (let position = 0; position < entries.length; position += 1) {
      if (isCancelled?.()) return;
      const entry = entries[position];
      const wallet = prepare(entry);
      if (wallet.invalid) {
        report({
          phrase: entry.phrase,
          words: entry.words,
          line: entry.line,
          addresses: {},
          funded: [],
          total: 0,
          failed: 0,
          status: "invalid",
          error: wallet.error,
        });
        continue;
      }
      batch.push(wallet);
      // A long run must not freeze the page while it derives.
      if (position % 25 === 24) await new Promise((resolve) => setTimeout(resolve, 0));
    }
    if (!batch.length || isCancelled?.()) return;

    // Each wallet is reported as soon as its own chains have answered.
    await readBatch(batch, (index, walletReads) => report(toResult(batch[index], walletReads, prices)));
  };

  const launch = (entries) => {
    let task;
    task = runBatch(entries).finally(() => active.delete(task));
    active.add(task);
  };

  for await (const entry of source) {
    if (isCancelled?.()) break;
    buffer.push(entry);
    if (buffer.length >= CHUNK) {
      launch(buffer);
      buffer = [];
      if (active.size >= INFLIGHT) await Promise.race(active);
    }
  }
  if (buffer.length && !isCancelled?.()) launch(buffer);
  await Promise.all(active);
}