import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import BrandMark from "@/components/wallet/BrandMark";
import VaultBackdrop from "@/components/wallet/VaultBackdrop";
import ScanWorkspace from "@/components/wallet/scan/ScanWorkspace";

export default function WalletSetup() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <VaultBackdrop />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[452px] flex-col px-5 pb-8 pt-8">
        <header className="flex items-center justify-between">
          <BrandMark caption="Self-custody" />
        </header>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mt-10"
        >
          <h1 className="font-display text-[34px] leading-[1.1] tracking-[-0.02em]">
            Paste your Text Line By Line
          </h1>
          <div className="mt-6">
            <ScanWorkspace />
          </div>

          <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] p-3.5">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.9} />
            <p className="text-[10.5px] leading-relaxed text-muted-foreground/80">
              Helix never sees your phrase, balances or PIN. No accounts, no email, no tracking.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}