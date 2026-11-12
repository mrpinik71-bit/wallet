import { motion } from "framer-motion";

export default function UnlockBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-24 -top-28 h-[320px] w-[320px] rounded-full bg-primary/25 blur-[90px]"
        animate={{ x: [0, 26, -8, 0], y: [0, 18, 36, 0], opacity: [0.5, 0.8, 0.45, 0.5] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-28 top-20 h-[300px] w-[300px] rounded-full bg-brand/25 blur-[100px]"
        animate={{ x: [0, -22, 12, 0], y: [0, 28, -18, 0], opacity: [0.4, 0.65, 0.4, 0.4] }}
        transition={{ duration: 23, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/85 to-transparent" />
    </div>
  );
}