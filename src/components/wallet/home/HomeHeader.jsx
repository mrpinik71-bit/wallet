import { Link } from "@tanstack/react-router";
import { ChevronDown, History, ScanLine, Wallet } from "lucide-react";

export default function HomeHeader({ address }) {
  return (
    <div className="flex items-center justify-between">
      <Link
        to="/wallet"
        className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 py-1 pl-1 pr-3 transition-colors hover:border-border"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary/35 to-primary/5 ring-1 ring-inset ring-primary/25">
          <Wallet className="h-3.5 w-3.5 text-primary" strokeWidth={1.9} />
        </span>
        <span className="text-[12px] font-medium tracking-tight">Wallet 1</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" strokeWidth={2.2} />
      </Link>

      <div className="flex items-center gap-2">
        <Link
          to="/activity"
          aria-label="Transaction history"
          className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-card/80 text-muted-foreground transition-colors hover:text-foreground"
        >
          <History className="h-[15px] w-[15px]" strokeWidth={1.75} />
        </Link>
        <Link
          to="/send"
          search={{ scan: "1" }}
          aria-label="Scan a QR code"
          className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-card/80 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ScanLine className="h-[15px] w-[15px]" strokeWidth={1.75} />
        </Link>
      </div>
      {address ? <span className="sr-only">Primary address {address}</span> : null}
    </div>
  );
}