import { Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Compass,
  History,
  KeyRound,
  LayoutDashboard,
  LineChart,
  LogOut,
  Repeat,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

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

const mobileNav = [nav[0], nav[1], nav[5], nav[6], nav[7]];

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
          <p className="font-heading text-[15px] font-semibold tracking-tight">Helix</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Multichain</p>
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
  const { user, logout } = useAuth();
  const initials = (user?.full_name || user?.email || "H").trim().slice(0, 2).toUpperCase();

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
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{user?.full_name || "Account"}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              aria-label="Sign out"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/70 bg-background/80 px-5 py-3.5 backdrop-blur-xl lg:hidden">
          <Brand />
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
            {initials}
          </span>
        </header>
        <main className="mx-auto w-full max-w-[1180px] px-5 pb-28 pt-6 lg:px-10 lg:pb-14 lg:pt-10">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between">
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
      className="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] text-muted-foreground transition-colors"
      activeProps={{ className: "text-primary" }}
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} />
      <span>{item.label}</span>
    </Link>
  );
}