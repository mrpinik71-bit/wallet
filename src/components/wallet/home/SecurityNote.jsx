import { ShieldCheck } from "lucide-react";

export default function SecurityNote() {
  return (
    <section className="flex items-start gap-3 rounded-[22px] border border-border/70 bg-card/40 p-4">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/12 ring-1 ring-inset ring-primary/25">
        <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-[12px] font-medium">Self-custody vault</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Keys are encrypted on this device and unlocked by your 4-digit PIN. No one else can access them.
        </p>
      </div>
    </section>
  );
}