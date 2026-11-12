import { useState } from "react";
import { KeyRound, Plus } from "lucide-react";
import CreateWallet from "./CreateWallet";
import ImportWallet from "./ImportWallet";

export default function WalletSetup() {
  const [mode, setMode] = useState("choose");

  if (mode === "create") {
    return (
      <div className="panel mx-auto max-w-2xl p-6">
        <CreateWallet onCancel={() => setMode("choose")} />
      </div>
    );
  }

  if (mode === "import") {
    return (
      <div className="panel mx-auto max-w-2xl p-6">
        <ImportWallet onCancel={() => setMode("choose")} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("create")}
          className="group panel p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 ring-1 ring-inset ring-primary/25">
            <Plus className="h-4 w-4 text-primary" />
          </span>
          <p className="mt-4 font-heading text-sm font-semibold">Create a new wallet</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
            Generate a fresh 12 or 24 word recovery phrase on this device.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode("import")}
          className="group panel p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary ring-1 ring-inset ring-border">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </span>
          <p className="mt-4 font-heading text-sm font-semibold">I already have a wallet</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
            Restore access with an existing recovery phrase.
          </p>
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-border/70 bg-card/60 p-4">
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Self-custody means only you hold the keys. Your phrase is encrypted on this device and is
          never uploaded, so no one — including Helix — can recover it for you.
        </p>
      </div>
    </div>
  );
}