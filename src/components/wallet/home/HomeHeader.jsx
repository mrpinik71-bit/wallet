import { Link } from "@tanstack/react-router";
import { ChevronDown, History, ScanLine, Wallet } from "lucide-react";
import { shortAddress } from "@/lib/format";

export default function HomeHeader({ address }) {
  return (
    <div className="flex items-center justify-between">
      <Link
        to="/wallet"
        className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/50 py-1.5 pl-2 pr-3 transition-colors hover:border-border"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-destructive/15">
          <Wallet className="h-3.5 w-3.5 text-destructive" />
        </span>
        <span className="text-[12px] font-medium">Wallet 1</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </Link>

      <div className="flex items-center gap-2">
        <Link
          to="/activity"
          aria-label="Transaction history"
          className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-secondary/50 text-muted-foreground transition-colors hover:text-foreground"
        >
          <History className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        <Link
          to="/send"
          search={{ scan: "1" }}
          aria-label="Scan a QR code"
          className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-secondary/50 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ScanLine className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>
      {address ? <span className="sr-only">{shortAddress(address)}</span> : null}
    </div>
  );
}