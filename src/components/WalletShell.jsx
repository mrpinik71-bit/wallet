import { Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Compass,
  History,
  KeyRound,
  LayoutDashboard,
  LineChart,
  Lock,
  Repeat,
} from "lucide-react";
import { useWallet } from "@/lib/WalletContext";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/markets", label: "Markets", icon: LineChart },
  { to: "/activity", label: "Activity", icon: History },
  { to: "/send", label: "Send", icon: ArrowUpRight },
  { to: "/receive", label: "Receive", icon: ArrowDownLeft },
  { to: "/swap", label: "Swap", icon: Repeat },
  { to: "/browser", label: "Browser", icon: Compass },
  { to: "/wallet", label: "Wallet", icon: KeyRound },
];

const mobileNav = [nav[0], nav[1], nav[6], nav[7]];

function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 ring-1 ring-inset ring-primary/30">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary" fill="none" aria-hidden="true">
          <path d="M8 3.5c0 4.5 8 4.5 8 9s-8 4.5-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M16 3.5c0 4.5-8 4.5-8 9s8 4.5 8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.45" />
        </svg>
      </span>
      {!compact && (
        <div className="leading-none">
          <p className="font-display text-[19px] leading-none">Helix</p>
          <p className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.28em] text-muted-foreground/75">Multichain</p>
        </div>
      )}
    </div>
  );
}

function NavLink({ item }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.to === "/" }}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
      activeProps={{ className: "bg-secondary text-foreground" }}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      <span>{item.label}</span>
    </Link>
  );
}

export default function WalletShell({ children }) {
  const { wallet, lock } = useWallet();

  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-border/70 bg-card/40 px-5 py-6 lg:flex">
        <Link to="/" className="px-1">
          <Brand />
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink key={item.to} item={item} />
          ))}
        </nav>
        <div className="mt-6 rounded-2xl border border-border/70 bg-secondary/30 p-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary">
              <KeyRound className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">Self-custody vault</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {wallet?.wordCount || 12}-word phrase · PIN protected
              </p>
            </div>
            <button
              type="button"
              onClick={lock}
              aria-label="Lock wallet"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Lock className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <main className="mx-auto w-full max-w-[1180px] px-5 pb-32 pt-[max(1.25rem,env(safe-area-inset-top))] lg:px-10 lg:pb-14 lg:pt-10">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex w-full max-w-[420px] items-center justify-between rounded-full border border-border/70 bg-card/95 px-3 py-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          {mobileNav.map((item) => (
            <NavLinkMobile key={item.to} item={item} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavLinkMobile({ item }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.to === "/" }}
      aria-label={item.label}
      className="group flex flex-1 flex-col items-center gap-1 rounded-2xl py-1 text-muted-foreground transition-colors data-[status=active]:text-primary"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl transition-colors group-data-[status=active]:bg-primary/10">
        <Icon className="h-[19px] w-[19px]" strokeWidth={1.8} />
      </span>
      <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
    </Link>
  );
}