import { motion } from "framer-motion";

const cells = [0, 1, 2, 3];

export default function PinCells({ length, error }) {
  return (
    <motion.div
      animate={error ? { x: [0, -9, 9, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.42, ease: "easeInOut" }}
      className="flex items-center justify-center gap-3"
    >
      {cells.map((index) => {
        const filled = index < length;
        const tone = error
          ? "border-destructive/50 bg-destructive/10"
          : filled
            ? "border-primary/55 bg-primary/10 shadow-[0_0_24px_-8px_hsl(var(--primary)/0.8)]"
            : "border-border/70 bg-card/50";

        return (
          <div
            key={index}
            className={`grid h-[58px] w-[52px] place-items-center rounded-[18px] border backdrop-blur transition-colors duration-200 ${tone}`}
          >
            {filled ? (
              <motion.span
                initial={{ scale: 0.35, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 520, damping: 24 }}
                className={`h-2.5 w-2.5 rounded-full ${
                  error ? "bg-destructive" : "bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.8)]"
                }`}
              />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-border" />
            )}
          </div>
        );
      })}
    </motion.div>
  );
}