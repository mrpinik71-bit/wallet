import { motion } from "framer-motion";
import { Delete } from "lucide-react";

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "blank", "0", "delete"];

const keyClass =
  "grid h-[58px] place-items-center rounded-[20px] border border-border/60 bg-gradient-to-b from-card/90 to-card/40 font-heading text-[21px] font-medium tabular text-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.07)] backdrop-blur transition-colors hover:border-border hover:from-card disabled:opacity-40";

export default function PinKeypad({ onDigit, onDelete, disabled, canDelete }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {keys.map((key) => {
        if (key === "blank") return <span key="blank" />;

        if (key === "delete") {
          return (
            <motion.button
              key="delete"
              type="button"
              whileTap={{ scale: 0.93 }}
              onClick={onDelete}
              disabled={disabled || !canDelete}
              aria-label="Delete last digit"
              className="grid h-[58px] place-items-center rounded-[20px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Delete className="h-5 w-5" strokeWidth={1.8} />
            </motion.button>
          );
        }

        return (
          <motion.button
            key={key}
            type="button"
            whileTap={{ scale: 0.93 }}
            onClick={() => onDigit(key)}
            disabled={disabled}
            className={keyClass}
          >
            {key}
          </motion.button>
        );
      })}
    </div>
  );
}