import { useEffect, useState } from "react";
import { KeyRound, Trash2 } from "lucide-react";
import { chains } from "@/lib/chains/config";
import {
  clearCustomEndpoint,
  readCustomRpc,
  RPC_SETTINGS_EVENT,
  setCustomEndpoint,
} from "@/lib/chains/custom-rpc";

// Every chain the scan reads, A→Z, so the picker reads like a chain list.
const OPTIONS = Object.values(chains)
  .map(({ id, name }) => ({ id, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

export default function RpcKeysPanel() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState({});
  const [chainId, setChainId] = useState("stacks");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = () => setSaved(readCustomRpc());
    sync();
    window.addEventListener(RPC_SETTINGS_EVENT, sync);
    return () => window.removeEventListener(RPC_SETTINGS_EVENT, sync);
  }, []);

  const entries = Object.entries(saved);

  function save() {
    const value = url.trim();
    if (!/^https:\/\/\S+$/i.test(value)) {
      setError("Paste the full endpoint URL, starting with https://");
      return;
    }
    setCustomEndpoint(chainId, value);
    setUrl("");
    setError("");
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.1] bg-foreground/[0.03] px-3 py-1.5 text-[10.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <KeyRound className="h-3 w-3" />
        Own RPC keys{entries.length ? ` · ${entries.length}` : ""}
      </button>

      {open ? (
        <div className="lux noise relative mt-2.5 p-4">
          <p className="relative text-[10.5px] leading-relaxed text-muted-foreground/80">
            Add your own node URL for a chain and the scan reads it there instead of a shared public node — much faster,
            far fewer failed reads. Kept on this device only, never uploaded.
          </p>

          <div className="relative mt-3 space-y-2">
            <select
              value={chainId}
              onChange={(event) => setChainId(event.target.value)}
              className="w-full rounded-xl border border-foreground/[0.12] bg-foreground/[0.04] px-3 py-2 text-[11.5px] text-foreground outline-none focus:border-primary/60"
            >
              {OPTIONS.map((chain) => (
                <option key={chain.id} value={chain.id} className="bg-card text-foreground">
                  {chain.name}
                </option>
              ))}
            </select>
            <input
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setError("");
              }}
              placeholder="https://…"
              spellCheck={false}
              autoCapitalize="none"
              className="w-full rounded-xl border border-foreground/[0.12] bg-foreground/[0.04] px-3 py-2 font-mono text-[11px] text-foreground outline-none focus:border-primary/60"
            />
            {error ? <p className="text-[10.5px] text-destructive">{error}</p> : null}
            <button
              type="button"
              onClick={save}
              className="w-full rounded-xl border border-primary/40 bg-primary/15 py-2 text-[10.5px] font-medium uppercase tracking-[0.14em] text-primary transition-colors hover:bg-primary/25"
            >
              Save endpoint
            </button>
          </div>

          {entries.length ? (
            <ul className="relative mt-3 space-y-1.5">
              {entries.map(([id, endpoint]) => (
                <li
                  key={id}
                  className="flex items-center gap-2 rounded-xl border border-foreground/[0.08] px-2.5 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium">{chains[id]?.name || id}</p>
                    <p className="truncate font-mono text-[9.5px] text-muted-foreground/70">{endpoint}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => clearCustomEndpoint(id)}
                    aria-label={`Remove ${chains[id]?.name || id} endpoint`}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}