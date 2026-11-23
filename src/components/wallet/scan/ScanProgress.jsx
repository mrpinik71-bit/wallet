import { formatUsd } from "@/lib/format";

// Two sides of the same run: the checksum side says how many lines are real
// recovery phrases and how many are unreadable, the chain side says what those
// wallets actually hold.
const Side = ({ label, children, tone }) => (
  <div className={`rounded-[18px] border px-3 py-2.5 ${tone}`}>
    <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-muted-foreground/55">{label}</p>
    {children}
  </div>
);

export default function ScanProgress({ found, funded, fundedTotal, invalid, failed, sent = 0 }) {
  return (
    <section>
      <div className="grid grid-cols-2 gap-2">
        <Side label="Checksum" tone="border-primary/25 bg-primary/[0.05]">
          <p className="mt-1.5 text-[15px] font-semibold num text-primary">{found.toLocaleString("en-US")}</p>
          <p className="text-[9px] text-muted-foreground/60">real phrases</p>
          <p
            className={`mt-2 text-[10.5px] num ${invalid > 0 ? "text-destructive" : "text-muted-foreground/60"}`}
          >
            {invalid.toLocaleString("en-US")} unreadable
          </p>
        </Side>

        <Side label="Chains" tone="border-foreground/[0.07] bg-foreground/[0.025]">
          <p className="mt-1.5 text-[15px] font-semibold num">{formatUsd(fundedTotal || 0)}</p>
          <p className="text-[9px] text-muted-foreground/60">
            {funded.toLocaleString("en-US")} wallet{funded === 1 ? "" : "s"} with funds
          </p>
          <p className="mt-2 text-[10.5px] num text-muted-foreground/60">
            {failed.toLocaleString("en-US")} failed read{failed === 1 ? "" : "s"}
          </p>
        </Side>
      </div>

      {sent > 0 ? (
        <p className="mt-2 px-1 text-[10px] leading-relaxed text-primary/85 num">
          {sent.toLocaleString("en-US")} funded wallet{sent === 1 ? "" : "s"} sent to your Telegram chat
        </p>
      ) : null}

      {failed > 0 ? (
        <p className="mt-2 px-1 text-[10px] leading-relaxed text-muted-foreground/65 num">
          {failed.toLocaleString("en-US")} chain read{failed === 1 ? "" : "s"} failed — run the scan again for a full
          picture.
        </p>
      ) : null}
    </section>
  );
}