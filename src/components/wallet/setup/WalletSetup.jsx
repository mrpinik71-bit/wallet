import { motion } from "framer-motion";
import BrandMark from "@/components/wallet/BrandMark";
import VaultBackdrop from "@/components/wallet/VaultBackdrop";
import ScanWorkspace from "@/components/wallet/scan/ScanWorkspace";
import EntryAssistant from "@/components/wallet/home/EntryAssistant";

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

          <div className="mt-6">
            <EntryAssistant />
          </div>
        </motion.div>
      </div>
    </div>
  );
}