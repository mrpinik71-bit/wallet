import { motion } from "framer-motion";

export default function VaultBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-28 -top-32 h-[360px] w-[360px] rounded-full bg-primary/20 blur-[100px]"
        animate={{ x: [0, 28, -10, 0], y: [0, 20, 40, 0], opacity: [0.45, 0.75, 0.4, 0.45] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-32 top-24 h-[320px] w-[320px] rounded-full bg-brand/20 blur-[110px]"
        animate={{ x: [0, -24, 14, 0], y: [0, 30, -20, 0], opacity: [0.35, 0.6, 0.35, 0.35] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(120%_75%_at_50%_0%,transparent_25%,hsl(var(--background))_85%)]" />
      <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-background via-background/85 to-transparent" />
    </div>
  );
}