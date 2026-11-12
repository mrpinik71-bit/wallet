export default function CoinAvatar({ symbol, color, size = "md" }) {
  const dims = size === "lg" ? "h-11 w-11 text-[13px]" : size === "sm" ? "h-7 w-7 text-[9px]" : "h-9 w-9 text-[11px]";
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