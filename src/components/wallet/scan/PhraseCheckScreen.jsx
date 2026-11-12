import BackButton from "@/components/wallet/BackButton";
import BrandMark from "@/components/wallet/BrandMark";
import VaultBackdrop from "@/components/wallet/VaultBackdrop";
import ScanWorkspace from "@/components/wallet/scan/ScanWorkspace";

export default function PhraseCheckScreen({ onClose }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <VaultBackdrop />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[452px] flex-col px-5 pb-10 pt-8">
        <header className="flex items-center justify-between">
          <BrandMark caption="On-device" />
          <BackButton onClick={onClose} />
        </header>

        <div className="mt-7">
          <p className="text-[9px] font-medium uppercase tracking-[0.34em] text-primary/70">Phrase checker</p>
          <h1 className="mt-3 font-display text-[34px] leading-[1.05] tracking-[-0.02em]">Check any phrase</h1>
          <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
            Paste recovery phrases or upload a text file. Every phrase is derived here and checked for balances on
            each supported chain — no wallet or PIN needed.
          </p>
        </div>

        <div className="mt-6">
          <ScanWorkspace />
        </div>
      </div>
    </div>
  );
}