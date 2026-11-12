import { motion } from "framer-motion";
import { Delete } from "lucide-react";

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "blank", "0", "delete"];

const keyClass =
  "relative grid h-[60px] place-items-center rounded-[19px] border border-foreground/[0.07] bg-gradient-to-b from-foreground/[0.055] to-foreground/[0.015] font-heading text-[21px] font-medium num text-foreground transition-colors hover:border-foreground/15 hover:from-foreground/10 disabled:opacity-40";

export default function PinKeypad({ onDigit, onDelete, disabled, canDelete }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
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
              className="grid h-[60px] place-items-center rounded-[19px] text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground disabled:opacity-25"
            >
              <Delete className="h-[18px] w-[18px]" strokeWidth={1.7} />
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