import { motion } from "framer-motion";
import { Loader2, LockKeyhole } from "lucide-react";

export default function VaultEmblem({ busy }) {
  return (
    <div className="relative mx-auto grid h-24 w-24 place-items-center">
      <motion.span
        aria-hidden="true"
        className="absolute inset-[-14px] rounded-full border border-dashed border-primary/25"
        animate={{ rotate: 360 }}
        transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-2 rounded-full bg-primary/20 blur-2xl"
      />
      <motion.span
        className="relative grid h-full w-full place-items-center rounded-[30px] border border-border/70 bg-card/80 backdrop-blur-xl shadow-[0_26px_60px_-30px_hsl(var(--primary)/0.65)]"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="absolute inset-[6px] rounded-[24px] border border-foreground/[0.05]" />
        {busy ? (
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        ) : (
          <LockKeyhole className="h-7 w-7 text-primary" strokeWidth={1.6} />
        )}
      </motion.span>
    </div>
  );
}