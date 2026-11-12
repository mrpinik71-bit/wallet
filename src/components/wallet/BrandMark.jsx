export default function BrandMark({ caption = "Private wallet" }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-[13px] border border-foreground/10 bg-foreground/[0.04]">
        <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] text-primary" fill="none" aria-hidden="true">
          <path d="M8 3.5c0 4.5 8 4.5 8 9s-8 4.5-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M16 3.5c0 4.5-8 4.5-8 9s8 4.5 8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.45" />
        </svg>
      </span>
      <div className="leading-none">
        <p className="font-display text-[20px] leading-none tracking-[0.005em]">Helix</p>
        <p className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.28em] text-muted-foreground/75">
          {caption}
        </p>
      </div>
    </div>
  );
}