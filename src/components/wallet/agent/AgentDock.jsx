import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import usePortfolio from "@/hooks/usePortfolio";
import AgentChat from "@/components/wallet/agent/AgentChat";

/**
 * The agent follows the user across every page: a floating launcher that opens
 * the same chat in a panel, so a task can start anywhere in the app.
 */
export default function AgentDock() {
  const [open, setOpen] = useState(false);
  const { holdings, total, changePct, addresses, refresh } = usePortfolio();

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open the Helix agent"
        className="fixed right-4 z-30 flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-3.5 py-2.5 text-primary shadow-[0_12px_36px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-colors hover:bg-primary/25 bottom-[calc(6.2rem+env(safe-area-inset-bottom))] lg:bottom-8 lg:right-8"
      >
        <Sparkles className="h-4 w-4" strokeWidth={1.9} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">Agent</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Helix agent"
            className="flex h-full w-full max-w-[440px] flex-col border-l border-border/70 bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Available on every page
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close the agent"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <AgentChat
                holdings={holdings}
                total={total}
                changePct={changePct}
                onRefresh={refresh}
                address={addresses.tron}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}