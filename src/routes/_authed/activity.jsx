import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Check, Clock, Repeat, Search } from "lucide-react";
import PageHeader from "@/components/wallet/PageHeader";
import { transactions } from "@/lib/sample-wallet";
import { formatDateTime, formatUsd, shortAddress } from "@/lib/format";

export const Route = createFileRoute("/_authed/activity")({
  head: () => ({
    meta: [
      { title: "Activity — Helix" },
      { name: "description", content: "Every transfer and swap across your wallets in one timeline." },
    ],
  }),
  component: Activity,
});

const filters = [
  { id: "all", label: "All" },
  { id: "send", label: "Sent" },
  { id: "receive", label: "Received" },
  { id: "swap", label: "Swaps" },
];

const icons = { send: ArrowUpRight, receive: ArrowDownLeft, swap: Repeat };

function Activity() {
  const [filter, setFilter] = useState("all");
  const rows = filter === "all" ? transactions : transactions.filter((tx) => tx.type === filter);

  const sent = transactions.filter((tx) => tx.type === "send").reduce((sum, tx) => sum + tx.valueUsd, 0);
  const received = transactions
    .filter((tx) => tx.type === "receive")
    .reduce((sum, tx) => sum + tx.valueUsd, 0);

  return (
    <>
      <PageHeader
        eyebrow="History"
        title="Activity"
        description="A complete record of what moved in and out of your wallet."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <p className="eyebrow">Received</p>
          <p className="mt-2 font-heading text-lg font-semibold tracking-tight tabular text-primary">
            {formatUsd(received)}
          </p>
        </div>
        <div className="panel p-4">
          <p className="eyebrow">Sent</p>
          <p className="mt-2 font-heading text-lg font-semibold tracking-tight tabular">{formatUsd(sent)}</p>
        </div>
        <div className="panel p-4">
          <p className="eyebrow">Transactions</p>
          <p className="mt-2 font-heading text-lg font-semibold tracking-tight tabular">
            {transactions.length}
          </p>
        </div>
      </div>

      <section className="panel mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-secondary/40 p-1">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  filter === item.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 self-start text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="h-3 w-3" /> Search by address or hash
          </button>
        </div>

        <ul className="divide-y divide-border/60">
          {rows.map((tx) => {
            const Icon = icons[tx.type];
            const sign = tx.type === "send" ? "−" : tx.type === "receive" ? "+" : "";
            return (
              <li key={tx.id} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary/30">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">
                    {tx.asset} <span className="text-muted-foreground">on {tx.chain}</span>
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {tx.type === "swap" ? tx.counterparty : shortAddress(tx.counterparty)} ·{" "}
                    {formatDateTime(tx.timestamp)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-medium tabular">
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
        {rows.length === 0 && (
          <p className="px-5 py-12 text-center text-[12px] text-muted-foreground">
            Nothing here yet for this filter.
          </p>
        )}
      </section>
    </>
  );
}