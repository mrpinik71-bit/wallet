import { ArrowDownLeft, ArrowUpRight, Check, Clock, Repeat } from "lucide-react";
import { transactions } from "@/lib/sample-wallet";
import { formatDateTime, shortAddress } from "@/lib/format";

const meta = {
  send: { icon: ArrowUpRight, label: "Sent", tone: "text-foreground" },
  receive: { icon: ArrowDownLeft, label: "Received", tone: "text-primary" },
  swap: { icon: Repeat, label: "Swapped", tone: "text-chart-2" },
};

export default function RecentActivity({ limit = 5 }) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
        <h2 className="font-heading text-sm font-semibold tracking-tight">Recent activity</h2>
        <span className="text-[11px] text-muted-foreground">{transactions.length} transfers</span>
      </div>
      <ul className="divide-y divide-border/60">
        {transactions.slice(0, limit).map((tx) => {
          const m = meta[tx.type];
          const Icon = m.icon;
          const sign = tx.type === "send" ? "-" : tx.type === "receive" ? "+" : "";
          return (
            <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">
                  {m.label} {tx.asset}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {tx.type === "swap" ? tx.counterparty : shortAddress(tx.counterparty)} · {formatDateTime(tx.timestamp)}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-[13px] font-medium tabular ${m.tone}`}>
                  {sign}
                  {tx.amount}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  {tx.status === "confirmed" ? (
                    <Check className="h-2.5 w-2.5 text-primary" />
                  ) : (
                    <Clock className="h-2.5 w-2.5 text-chart-3" />
                  )}
                  {tx.status}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}