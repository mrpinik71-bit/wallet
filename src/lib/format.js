export function formatUsd(value, { compact = false } = {}) {
  const abs = Math.abs(value);
  if (compact && abs >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: abs > 0 && abs < 1 ? 4 : 2,
    maximumFractionDigits: abs > 0 && abs < 1 ? 4 : 2,
  }).format(value);
}

/** Prices with the precision small-cap assets need (PEPE, SHIB, …). */
export function formatPrice(value) {
  const abs = Math.abs(value);
  if (!abs) return "$0.00";
  if (abs >= 1) return formatUsd(value);
  const digits = Math.min(8, Math.max(2, Math.ceil(-Math.log10(abs)) + 3));
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatAmount(value, symbol) {
  const digits = value >= 1000 ? 2 : value >= 1 ? 3 : 5;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value)} ${symbol}`;
}

export function formatCrypto(value) {
  if (!value) return "0";
  if (value < 0.0001) return Number(value.toPrecision(4)).toString();
  if (value < 1) return Number(value.toFixed(6)).toString();
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: value < 1000 ? 4 : 2 }).format(value);
}

export function formatPct(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function shortAddress(address, size = 6) {
  if (!address) return "";
  return `${address.slice(0, size)}…${address.slice(-4)}`;
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}