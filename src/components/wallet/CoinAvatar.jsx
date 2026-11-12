import { useState } from "react";

const sizes = {
  lg: "h-11 w-11 text-[13px]",
  sm: "h-7 w-7 text-[9px]",
  md: "h-9 w-9 text-[11px]",
};

export default function CoinAvatar({ symbol, color = "#8A92B2", logo, size = "md" }) {
  const [failed, setFailed] = useState(false);
  const dims = sizes[size] || sizes.md;

  if (logo && !failed) {
    return (
      <img
        src={logo}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full bg-secondary/60 object-contain ring-1 ring-inset ring-border/60 ${dims}`}
      />
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold ring-1 ring-inset ${dims}`}
      style={{
        backgroundColor: `${color}1f`,
        color,
        borderColor: `${color}40`,
        boxShadow: `inset 0 0 0 1px ${color}30`,
      }}
    >
      {symbol.slice(0, 4)}
    </span>
  );
}