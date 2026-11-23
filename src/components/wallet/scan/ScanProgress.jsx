import { formatUsd } from "@/lib/format";

const Cell = ({ label, value, tone }) => (
  <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] px-2.5 py-2">
    <p className="text-[8px] font-medium uppercase tracking-[0.16em] text-muted-foreground/55">{label}</p>
    <p className={`mt-1 text-[13px] font-semibold num ${tone || ""}`}>{value}</p>
  </div>
);

export default function ScanProgress({ found, funded, fundedTotal, invalid, failed, sent = 0 }) {
  return (
    <section className="rounded-[18px] border border-foreground/[0.07] bg-foreground/[0.025] px-3.5 py-3">
      <div className="grid grid-cols-2 gap-1.5">
        <Cell label="Wallets found" value={found.toLocaleString("en-US")} tone="text-foreground" />
        <Cell
          label="With funds"
          value={funded.toLocaleString("en-US")}
          tone={funded > 0 ? "text-primary" : "text-foreground"}
        />
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