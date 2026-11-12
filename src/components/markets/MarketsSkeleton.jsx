export default function MarketsSkeleton({ rows = 8 }) {
  return (
    <ul className="divide-y divide-foreground/[0.05]">
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="flex items-center gap-3 px-4 py-3.5">
          <span className="h-7 w-7 animate-pulse rounded-full bg-foreground/[0.06]" />
          <div className="flex-1 space-y-1.5">
            <span className="block h-2.5 w-24 animate-pulse rounded bg-foreground/[0.06]" />
            <span className="block h-2 w-16 animate-pulse rounded bg-foreground/[0.04]" />
          </div>
          <span className="h-2.5 w-14 animate-pulse rounded bg-foreground/[0.06]" />
        </li>
      ))}
    </ul>
  );
}