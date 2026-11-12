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
    <div className="mt-3 grid grid-cols-4 gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            to={action.to}
            className={`group flex flex-col items-center gap-2 rounded-[18px] border py-3.5 transition-all duration-150 active:scale-[0.97] ${
              action.primary
                ? "border-primary/45 bg-primary text-primary-foreground shadow-[0_18px_36px_-22px_hsl(var(--primary)/0.9)]"
                : "border-foreground/[0.07] bg-foreground/[0.025] text-foreground hover:border-foreground/15 hover:bg-foreground/[0.05]"
            }`}
          >
            <Icon
              className={`h-[17px] w-[17px] ${action.primary ? "" : "text-muted-foreground transition-colors group-hover:text-foreground"}`}
              strokeWidth={action.primary ? 2.1 : 1.8}
            />
            <span
              className={`text-[9.5px] font-medium uppercase tracking-[0.12em] ${action.primary ? "" : "text-muted-foreground group-hover:text-foreground"}`}
            >
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}