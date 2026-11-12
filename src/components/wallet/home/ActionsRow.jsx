import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, History, Repeat } from "lucide-react";

const actions = [
  { label: "Send", to: "/send", icon: ArrowUpRight, primary: true },
  { label: "Receive", to: "/receive", icon: ArrowDown, primary: false },
  { label: "Swap", to: "/swap", icon: Repeat, primary: false },
  { label: "Activity", to: "/activity", icon: History, primary: false },
];

export default function ActionsRow() {
  return (
    <div className="mt-3.5 grid grid-cols-4 gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            to={action.to}
            className={`group flex flex-col items-center gap-2 rounded-[20px] border py-3 transition-all duration-150 active:scale-[0.97] ${
              action.primary
                ? "border-primary/50 bg-primary text-primary-foreground shadow-[0_12px_30px_-16px_hsl(var(--primary)/0.9)]"
                : "border-border/70 bg-card/60 text-foreground hover:border-border hover:bg-card/90"
            }`}
          >
            <Icon
              className={`h-[18px] w-[18px] ${action.primary ? "" : "text-muted-foreground transition-colors group-hover:text-foreground"}`}
              strokeWidth={action.primary ? 2.2 : 1.9}
            />
            <span
              className={`text-[10.5px] font-medium tracking-tight ${action.primary ? "" : "text-muted-foreground group-hover:text-foreground"}`}
            >
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}