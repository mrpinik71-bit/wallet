import { formatUsd } from "@/lib/format";

const Cell = ({ label, value, tone }) => (
  <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] px-2.5 py-2">
    <p className="text-[8px] font-medium uppercase tracking-[0.16em] text-muted-foreground/55">{label}</p>
    <p className={`mt-1 text-[13px] font-semibold num ${tone || ""}`}>{value}</p>
  </div>
);

export default function ScanProgress({
  completed,
  total,
  detected,
  started = 0,
  elapsed = 0,
  found,
  funded,
  fundedTotal,
  invalid,
  failed,
  batch,
  sent = 0,
  finished,
}) {
  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const inflight = Math.max(0, started - completed);

  // Live throughput: how many wallets the scan is clearing each moment.
  const rate = elapsed > 0 ? completed / elapsed : 0;
  const speed =
    rate <= 0
      ? "—"
      : rate >= 1
        ? `${Math.round(rate).toLocaleString("en-US")}/s`
        : `${(rate * 60).toFixed(1)}/min`;

  return (
    <section className="rounded-[18px] border border-foreground/[0.07] bg-foreground/[0.025] px-3.5 py-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
          {!finished ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> : null}
          {finished ? "Scan finished" : "Scanning"}
        </span>
        <span className="text-[10.5px] font-medium text-muted-foreground/80 num">
          {completed.toLocaleString("en-US")}
          {total ? ` / ${total.toLocaleString("en-US")}` : ""} processed
          {finished && rate > 0 ? ` · ${speed} avg` : ""}
        </span>
      </div>

      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-foreground/[0.08]">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${total ? percent : finished ? 100 : 8}%` }}
        />
      </div>

      {!finished ? (
        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground/65 num">
          <span className="truncate">
            {inflight > 0
              ? `${inflight.toLocaleString("en-US")} wallet${inflight === 1 ? "" : "s"} being checked`
              : detected === 0
                ? "Reading the file line by line…"
                : "Waiting for the chains to answer…"}
          </span>
          <span className="shrink-0 tabular">
            {speed} · {elapsed}s
          </span>
        </div>
      ) : null}

      {!finished && batch ? (
        <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-muted-foreground/60 num">
          <span className="truncate">
            Batch {batch.number} of {Math.max(batch.number, Math.ceil((total || batch.to) / batch.size))}
          </span>
          <span className="shrink-0 tabular">
            wallets {batch.from.toLocaleString("en-US")}–{batch.to.toLocaleString("en-US")}
          </span>
        </div>
      ) : null}

      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
        <Cell label="Wallets found" value={found.toLocaleString("en-US")} tone="text-foreground" />
        <Cell label="With funds" value={funded.toLocaleString("en-US")} tone={funded > 0 ? "text-primary" : "text-foreground"} />
        <Cell label="Balance found" value={formatUsd(fundedTotal || 0)} tone="text-foreground" />
        <Cell
          label="Unreadable"
          value={invalid.toLocaleString("en-US")}
          tone={invalid > 0 ? "text-destructive" : "text-foreground"}
        />
      </div>

      {sent > 0 ? (
        <p className="mt-2 text-[10px] leading-relaxed text-primary/85 num">
          {sent.toLocaleString("en-US")} funded wallet{sent === 1 ? "" : "s"} sent to your Telegram chat
        </p>
      ) : null}

      {failed > 0 ? (
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/65 num">
          {failed.toLocaleString("en-US")} chain read{failed === 1 ? "" : "s"} failed — run the scan again for a full
          picture.
        </p>
      ) : null}
    </section>
  );
}