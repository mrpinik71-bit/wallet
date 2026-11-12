import { motion } from "framer-motion";
import { Loader2, LockKeyhole } from "lucide-react";

export default function VaultEmblem({ busy }) {
  return (
    <div className="relative mx-auto grid h-[86px] w-[86px] place-items-center">
      <span aria-hidden="true" className="absolute inset-2 rounded-full bg-primary/25 blur-2xl" />
      <motion.span
        aria-hidden="true"
        className="absolute inset-[-17px] rounded-full border border-dashed border-foreground/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 44, repeat: Infinity, ease: "linear" }}
      />
      <span className="relative grid h-full w-full place-items-center rounded-[27px] border border-foreground/10 bg-gradient-to-b from-card to-background shadow-[inset_0_1px_0_hsl(var(--foreground)/0.1),0_24px_50px_-30px_hsl(var(--primary)/0.6)]">
        <span className="pointer-events-none absolute inset-[5px] rounded-[22px] border border-foreground/[0.05]" />
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <LockKeyhole className="h-6 w-6 text-primary" strokeWidth={1.6} />
        )}
      </span>
    </div>
  );
}