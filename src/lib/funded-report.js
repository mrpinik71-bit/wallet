import { formatUsd } from "@/lib/format";

function compactAmount(value) {
  if (!value) return "0";
  if (value < 0.0001) return value.toPrecision(4);
  if (value < 1) return value.toFixed(6).replace(/0+$/, "");
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: value < 1000 ? 4 : 2 }).format(value);
}

export function reportFileName() {
  return `funded-phrases-${new Date().toISOString().slice(0, 10)}.txt`;
}

/** The .txt body: a header, then one block per funded wallet. */
export function buildReport(funded) {
  const total = funded.reduce((sum, slot) => sum + slot.total, 0);
  const lines = [
    "HELIX — FUNDED WALLETS",
    `Funded wallets: ${funded.length}`,
    `Balance found: ${formatUsd(total)}`,
    `Generated: ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC`,
    "",
  ];

  funded.forEach((slot, index) => {
    lines.push(`${index + 1}. ${slot.words}-word wallet · ${formatUsd(slot.total)}`);
    lines.push(`   ${slot.phrase}`);
    for (const item of slot.funded || []) {
      lines.push(`   - ${item.symbol}: ${compactAmount(item.balance)} (${formatUsd(item.value)})`);
    }
    lines.push("");
  });

  return lines.join("\n");
}

export function buildCaption(funded, scanned) {
  const total = funded.reduce((sum, slot) => sum + slot.total, 0);
  return [
    "Helix — funded wallets",
    `Scanned ${scanned.toLocaleString("en-US")} phrases · found ${funded.length}`,
    `Balance ${formatUsd(total)}`,
  ].join("\n");
}