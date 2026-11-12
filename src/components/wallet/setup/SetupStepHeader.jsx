import { ArrowLeft } from "lucide-react";

export default function SetupStepHeader({ step, total = 3, title, description, onBack, backLabel = "Back" }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={1.8} />
          {backLabel}
        </button>
        {step ? (
          <span className="text-[9px] font-medium uppercase tracking-[0.24em] text-muted-foreground/60">
            Step {step} of {total}
          </span>
        ) : null}
      </div>

      {step ? (
        <div className="mt-3.5 flex gap-1.5">
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={`h-[3px] flex-1 rounded-full ${index < step ? "bg-primary" : "bg-foreground/10"}`}
            />
          ))}
        </div>
      ) : null}

      <h2 className="mt-5 font-display text-[27px] leading-[1.08] tracking-[-0.01em]">{title}</h2>
      {description ? (
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}