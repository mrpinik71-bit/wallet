import { useEffect, useRef } from "react";
import ScanResultRow from "@/components/wallet/scan/ScanResultRow";

// The file's wallets live in their own scrolling display: the header keeps the
// file name and how many wallets it holds in view while the rows scroll.
export default function ScanResultsPanel({ rows, fileName, walletTotal, hasMore, remaining, onMore, liveCount = 0 }) {
  const boxRef = useRef(null);
  // A wallet that just landed is the newest row at the top of the list, so the
  // box follows it up on its own instead of leaving the reader further down.
  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollTo({ top: 0, behavior: "smooth" });
  }, [liveCount]);

  return (
    <div className="lux overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-foreground/[0.07] px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-muted-foreground/65">
            Wallets in this file
          </p>
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground/55">{fileName || "No file chosen"}</p>
        </div>
        <p className="shrink-0 font-display text-[16px] leading-none num text-primary">
          {walletTotal.toLocaleString("en-US")}
        </p>
      </div>

      <div
        ref={boxRef}
        className="max-h-[72vh] space-y-2 overflow-y-auto overscroll-contain p-2.5"
      >
        {rows.map(({ slot: row, position }) => (
          <ScanResultRow key={`${position}-${row.phrase}`} result={row} index={position} />
        ))}

        {hasMore ? (
          <button
            type="button"
            onClick={onMore}
            className="w-full rounded-xl border border-foreground/[0.1] py-2 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Show {Math.min(100, remaining)} more · {remaining.toLocaleString("en-US")} left
          </button>
        ) : null}
      </div>
    </div>
  );
}