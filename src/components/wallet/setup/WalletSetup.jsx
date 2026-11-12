import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound, Plus, Search, ShieldCheck } from "lucide-react";
import BrandMark from "@/components/wallet/BrandMark";
import VaultBackdrop from "@/components/wallet/VaultBackdrop";
import CreateWallet from "./CreateWallet";
import ImportWallet from "./ImportWallet";
import PhraseCheckScreen from "@/components/wallet/scan/PhraseCheckScreen";

const options = [
  {
    key: "create",
    icon: Plus,
    title: "Create a wallet",
    blurb: "Generate a new 12 or 24 word recovery phrase on this device.",
  },
  {
    key: "import",
    icon: KeyRound,
    title: "Import a wallet",
    blurb: "Restore access with a recovery phrase you already have.",
  },
];

export default function WalletSetup() {
  const [mode, setMode] = useState("choose");
  const [checker, setChecker] = useState(false);

  if (checker) {
    return <PhraseCheckScreen onClose={() => setChecker(false)} />;
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <VaultBackdrop />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[452px] flex-col px-5 pb-8 pt-8">
        <header className="flex items-center justify-between">
          <BrandMark caption="Self-custody" />
          <span className="text-[9px] font-medium uppercase tracking-[0.24em] text-muted-foreground/60">
            Get started
          </span>
        </header>

        {mode === "choose" ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-10"
          >
            <p className="text-[9px] font-medium uppercase tracking-[0.34em] text-primary/70">
              Multichain · Non-custodial
            </p>
            <h1 className="mt-3 font-display text-[44px] leading-[1.0] tracking-[-0.02em]">
              Your keys.
              <br />
              Your crypto.
            </h1>
            <p className="mt-3.5 max-w-[300px] text-[12px] leading-relaxed text-muted-foreground">
              A private wallet for every major chain. Your phrase is encrypted here and never leaves this
              device.
            </p>

            <div className="mt-8 space-y-2.5">
              {options.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setMode(option.key)}
                    className="lux noise group flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors hover:border-primary/30"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 ring-1 ring-inset ring-primary/20">
                      <Icon className="h-[17px] w-[17px] text-primary" strokeWidth={1.8} />
                    </span>
                    <span className="relative min-w-0 flex-1">
                      <span className="block font-heading text-[14px] font-semibold tracking-tight">
                        {option.title}
                      </span>
                      <span className="mt-1 block text-[11.5px] leading-relaxed text-muted-foreground">
                        {option.blurb}
                      </span>
                    </span>
                    <ArrowRight
                      className="relative h-4 w-4 shrink-0 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
                      strokeWidth={1.8}
                    />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setChecker(true)}
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-foreground/[0.12] py-3 text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              <Search className="h-3.5 w-3.5" strokeWidth={1.8} />
              Phrase checker — check any phrase for balances
            </button>

            <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] p-3.5">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.9} />
              <p className="text-[10.5px] leading-relaxed text-muted-foreground/80">
                Helix never sees your phrase, balances or PIN. No accounts, no email, no tracking.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="lux noise mt-6 overflow-hidden px-5 py-5"
          >
            {mode === "create" ? (
              <CreateWallet onCancel={() => setMode("choose")} />
            ) : (
              <ImportWallet onCancel={() => setMode("choose")} />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}