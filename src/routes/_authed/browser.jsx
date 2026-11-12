import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Globe, Lock, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/wallet/PageHeader";
import { featuredApps } from "@/lib/sample-wallet";

export const Route = createFileRoute("/_authed/browser")({
  head: () => ({
    meta: [
      { title: "Browser — Helix" },
      { name: "description", content: "Reach the decentralised web from a curated, verified dapp list." },
    ],
  }),
  component: Browser,
});

function Browser() {
  const [url, setUrl] = useState("");

  function open(event) {
    event.preventDefault();
    const target = url.trim();
    if (!target) return;
    const normalized = /^https?:\/\//i.test(target) ? target : `https://${target}`;
    window.open(normalized, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <PageHeader
        eyebrow="Dapps"
        title="Browser"
        description="Explore curated apps across the chains you hold. Every site opens in a separate, sandboxed tab."
      />

      <form onSubmit={open} className="panel flex items-center gap-2 p-2.5">
        <span className="pl-2 text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
        </span>
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Search or enter a dapp URL"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[13px] outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary transition-colors hover:bg-primary/25"
          aria-label="Open URL"
        >
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Verified destinations only. Never enter your recovery phrase on any website — legitimate apps
          will never ask for it.
        </p>
      </div>

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold tracking-tight">Featured apps</h2>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Globe className="h-3 w-3" /> {featuredApps.length} apps
          </span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featuredApps.map((app) => (
            <a
              key={app.name}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="panel group p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="flex items-center gap-3">
                <span
                  className="grid h-9 w-9 place-items-center rounded-xl text-[12px] font-semibold"
                  style={{ backgroundColor: `${app.color}22`, color: app.color }}
                >
                  {app.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{app.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {app.category} · {app.chain}
                  </p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">{app.blurb}</p>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}