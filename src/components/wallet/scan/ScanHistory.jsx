import { useEffect, useState } from "react";
import { ChevronDown, History, Trash2 } from "lucide-react";
import ScanResultRow from "@/components/wallet/scan/ScanResultRow";
import { clearHistory, readHistory } from "@/lib/scan-history";
import { formatUsd } from "@/lib/format";

const when = (at) =>
  new Date(at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ScanHistory({ refreshKey = 0 }) {
  const [runs, setRuns] = useState([]);
  const [openId, setOpenId] = useState(null);

  // Read after mount only: the log lives in this device's storage.
  useEffect(() => {
    setRuns(readHistory());
  }, [refreshKey]);

  return (
    <div className="mt-7">
      <div className="flex items-end justify-between px-1">
        <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-muted-foreground/70">History</p>
        {runs.length ? (
          <button
            type="button"
            onClick={() => {
              clearHistory();
              setRuns([]);
              setOpenId(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.1] px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Trash2 className="h-3 w-3" />
            Clear log
          </button>
        ) : null}
      </div>

      {!runs.length ? (
        <p className="mt-3 rounded-[18px] border border-dashed border-foreground/[0.09] px-3.5 py-4 text-center text-[10.5px] leading-relaxed text-muted-foreground/60">
          Every finished scan is logged here, with each wallet that holds funds highlighted.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {runs.map((run) => {
            const open = openId === run.id;
            const funded = run.funded > 0;
            return (
              <div
                key={run.id}
                className={`overflow-hidden rounded-[18px] border ${
                  funded ? "border-primary/30 bg-primary/[0.04]" : "border-foreground/[0.07] bg-foreground/[0.02]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : run.id)}
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
                >
                  <History className={`h-3.5 w-3.5 shrink-0 ${funded ? "text-primary" : "text-muted-foreground/50"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11.5px] font-medium">{when(run.at)}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-muted-foreground/70">
                      {(run.scanned || 0).toLocaleString("en-US")} wallet{run.scanned === 1 ? "" : "s"} scanned ·{" "}
                      {funded ? `${run.funded} funded` : "no balance"}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-[12px] font-semibold num ${funded ? "text-primary" : "text-muted-foreground/50"}`}
                  >
                    {formatUsd(run.total || 0)}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {open ? (
                  <div className="border-t border-foreground/[0.06] px-3 py-3">
                    {run.wallets?.length ? (
                      <div className="space-y-2">
                        {run.wallets.map((wallet, position) => (
                          <ScanResultRow
                            key={`${run.id}-${position}`}
                            result={{ ...wallet, status: "done" }}
                            index={position}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10.5px] text-muted-foreground/70">
                        No balance found on the wallets in this scan.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}