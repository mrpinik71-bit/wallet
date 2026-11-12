import { ShieldAlert } from "lucide-react";

export default function NoticeBanner({ title, children }) {
  return (
    <div className="mb-5 flex gap-3 rounded-2xl border border-chart-3/25 bg-chart-3/5 p-4">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-chart-3" strokeWidth={1.9} />
      <div>
        <p className="text-[13px] font-medium">{title}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}