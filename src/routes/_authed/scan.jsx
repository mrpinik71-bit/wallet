import { createFileRoute } from "@tanstack/react-router";
import ScanWorkspace from "@/components/wallet/scan/ScanWorkspace";

export const Route = createFileRoute("/_authed/scan")({
  head: () => ({
    meta: [
      { title: "Batch scan — Helix" },
      { name: "description", content: "Check the balances of many recovery phrases at once, on this device." },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  return (
    <div className="relative mx-auto w-full max-w-[458px] lg:max-w-[720px]">
      <div
        aria-hidden="true"
        className="glow-mint pointer-events-none absolute -top-16 left-1/2 h-40 w-[320px] -translate-x-1/2 opacity-60"
      />

      <div className="relative">
        <ScanWorkspace />
      </div>
    </div>
  );
}