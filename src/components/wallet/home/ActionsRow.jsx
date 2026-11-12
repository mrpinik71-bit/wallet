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
    <div className="mt-6 grid grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.label} to={action.to} className="flex flex-col items-center gap-2">
            <span
              className={`grid h-14 w-14 place-items-center rounded-2xl transition-transform active:scale-95 ${
                action.tone === "brand"
                  ? "bg-brand text-brand-foreground"
                  : "bg-action text-action-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
}