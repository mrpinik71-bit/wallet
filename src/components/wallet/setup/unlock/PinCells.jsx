import { motion } from "framer-motion";

const cells = [0, 1, 2, 3];

export default function PinCells({ length, error }) {
  return (
    <motion.div
      animate={error ? { x: [0, -9, 9, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.42, ease: "easeInOut" }}
      className="flex items-center justify-center gap-2.5"
    >
      {cells.map((index) => {
        const filled = index < length;
        const tone = error
          ? "border-destructive/45 bg-destructive/[0.08]"
          : filled
            ? "border-primary/40 bg-primary/[0.08] shadow-[0_0_28px_-10px_hsl(var(--primary)/0.9)]"
            : "border-foreground/[0.08] bg-foreground/[0.025]";

        return (
          <div
            key={index}
            className={`relative grid h-[62px] w-[55px] place-items-center rounded-[19px] border transition-colors duration-200 ${tone}`}
          >
            <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent" />
            {filled ? (
              <motion.span
                initial={{ scale: 0.35, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 520, damping: 24 }}
                className={`h-[9px] w-[9px] rounded-full ${
                  error ? "bg-destructive" : "bg-primary shadow-[0_0_14px_hsl(var(--primary)/0.9)]"
                }`}
              />
            ) : (
              <span className="h-[5px] w-[5px] rounded-full bg-foreground/15" />
            )}
          </div>
        );
      })}
    </motion.div>
  );
}