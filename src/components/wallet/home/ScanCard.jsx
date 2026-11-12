import { Link } from "@tanstack/react-router";
import { ChevronRight, ScanLine } from "lucide-react";

export default function ScanCard() {
  return (
    <Link
      to="/scan"
      className="mt-3 flex items-center gap-3 rounded-[20px] border border-foreground/[0.07] bg-foreground/[0.025] px-4 py-3.5 transition-colors hover:border-foreground/15 hover:bg-foreground/[0.05] active:scale-[0.99]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-foreground/10 bg-foreground/[0.04] text-primary">
        <ScanLine className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-medium tracking-[-0.01em]">
          Bulk wallet scan
        </span>
        <span className="block truncate text-[10.5px] text-muted-foreground">
          Check balances for many phrases — on this device
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}