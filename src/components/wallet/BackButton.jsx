import { ArrowLeft } from "lucide-react";

export default function BackButton({ onClick, label = "Back" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.09] bg-foreground/[0.03] px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/15 hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.9} />
      {label}
    </button>
  );
}