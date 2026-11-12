import { ShieldCheck } from "lucide-react";

export default function SecurityNote() {
  return (
    <section className="flex items-start gap-3 rounded-[22px] border border-foreground/[0.06] bg-foreground/[0.02] p-4">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/20">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={1.9} />
      </span>
      <div>
        <p className="font-heading text-[11.5px] font-semibold tracking-tight">Self-custody vault</p>
        <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground/80">
          Keys are encrypted on this device and unlocked by your 4-digit PIN. No one else can access them.
        </p>
      </div>
    </section>
  );
}