import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, History, Repeat } from "lucide-react";

const actions = [
  { label: "Send", to: "/send", icon: ArrowUpRight, tone: "light" },
  { label: "Receive", to: "/receive", icon: ArrowDown, tone: "light" },
  { label: "Swap", to: "/swap", icon: Repeat, tone: "brand" },
  { label: "Activity", to: "/activity", icon: History, tone: "light" },
];

export default function ActionsRow() {
  return (
    <div className="mt-8 grid grid-cols-4 gap-2.5">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.label} to={action.to} className="group flex flex-col items-center gap-2">
            <span
              className={`grid h-[54px] w-[54px] place-items-center rounded-[19px] transition-transform duration-150 group-active:scale-95 ${
                action.tone === "brand"
                  ? "bg-brand text-brand-foreground shadow-[0_10px_30px_-12px_hsl(var(--brand)/0.9)]"
                  : "bg-action text-action-foreground shadow-[0_10px_30px_-16px_rgba(255,255,255,0.55)]"
              }`}
            >
              <Icon className="h-[19px] w-[19px]" strokeWidth={2} />
            </span>
            <span className="text-[11px] font-medium tracking-tight text-muted-foreground transition-colors group-hover:text-foreground">
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}