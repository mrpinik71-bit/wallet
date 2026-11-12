import { Link } from "@tanstack/react-router";
import { ChevronDown, History, ScanLine, Wallet } from "lucide-react";

export default function HomeHeader({ address }) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="relative grid h-11 w-11 place-items-center rounded-[16px] border border-foreground/10 bg-gradient-to-b from-foreground/[0.07] to-foreground/[0.02]">
          <Wallet className="h-4 w-4 text-primary" strokeWidth={1.8} />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
        </span>
        <div className="leading-none">
          <p className="text-[9px] font-medium uppercase tracking-[0.28em] text-muted-foreground/70">
            Portfolio
          </p>
          <Link
            to="/wallet"
            className="mt-1.5 inline-flex items-center gap-1 font-heading text-[15px] font-semibold tracking-tight transition-colors hover:text-primary"
          >
            Main wallet
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/activity"
          aria-label="Transaction history"
          className="grid h-10 w-10 place-items-center rounded-2xl border border-foreground/[0.08] bg-foreground/[0.03] text-muted-foreground transition-colors hover:border-foreground/15 hover:text-foreground"
        >
          <History className="h-4 w-4" strokeWidth={1.7} />
        </Link>
        <Link
          to="/send"
          search={{ scan: "1" }}
          aria-label="Scan a QR code"
          className="grid h-10 w-10 place-items-center rounded-2xl border border-foreground/[0.08] bg-foreground/[0.03] text-muted-foreground transition-colors hover:border-foreground/15 hover:text-foreground"
        >
          <ScanLine className="h-4 w-4" strokeWidth={1.7} />
        </Link>
      </div>
      {address ? <span className="sr-only">Primary address {address}</span> : null}
    </header>
  );
}