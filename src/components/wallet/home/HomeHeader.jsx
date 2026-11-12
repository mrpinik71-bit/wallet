import { Link } from "@tanstack/react-router";
import { ChevronDown, History, ScanLine, Wallet } from "lucide-react";

export default function HomeHeader({ address }) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 ring-1 ring-inset ring-primary/25">
          <Wallet className="h-4 w-4 text-primary" strokeWidth={1.9} />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
        </span>
        <div className="leading-none">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Portfolio</p>
          <Link
            to="/wallet"
            className="mt-1.5 inline-flex items-center gap-1 font-heading text-[15px] font-semibold tracking-tight transition-colors hover:text-primary"
          >
            Main wallet
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.2} />
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/activity"
          aria-label="Transaction history"
          className="grid h-10 w-10 place-items-center rounded-2xl border border-border/70 bg-card/60 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
        >
          <History className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        <Link
          to="/send"
          search={{ scan: "1" }}
          aria-label="Scan a QR code"
          className="grid h-10 w-10 place-items-center rounded-2xl border border-border/70 bg-card/60 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
        >
          <ScanLine className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>
      {address ? <span className="sr-only">Primary address {address}</span> : null}
    </header>
  );
}