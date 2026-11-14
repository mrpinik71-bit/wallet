import { ErrorComponent, Link, rootRouteId, useMatch, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function DefaultCatchBoundary({ error }) {
  const router = useRouter();
  const isRoot = useMatch({ strict: false, select: (state) => state.id === rootRouteId });

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-24">
      <ErrorComponent error={error} />
      <p className="max-w-full break-words text-center font-mono text-[11px] leading-relaxed text-muted-foreground">
        {String(error?.message || error || "Unknown error")}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.invalidate()}>
          Try again
        </Button>
        <Button asChild>{isRoot ? <Link to="/">Home</Link> : <Link to="/" onClick={(e) => { e.preventDefault(); window.history.back(); }}>Go back</Link>}</Button>
      </div>
    </div>
  );
}