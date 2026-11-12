import { createFileRoute, Outlet } from "@tanstack/react-router";
import WalletShell from "@/components/WalletShell";
import WalletSetup from "@/components/wallet/setup/WalletSetup";
import UnlockVault from "@/components/wallet/setup/UnlockVault";
import { WalletProvider, useWallet } from "@/lib/WalletContext";

export const Route = createFileRoute("/_authed")({
  ssr: false,
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <WalletProvider>
      <WalletGate />
    </WalletProvider>
  );
}

function WalletGate() {
  const { status } = useWallet();

  if (status === "unlocked") {
    return (
      <WalletShell>
        <Outlet />
      </WalletShell>
    );
  }

  return (
    <div className="min-h-dvh bg-background px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <p className="font-heading text-sm font-semibold tracking-tight">Helix</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Multichain wallet</p>
        </div>
        {status === "loading" && <div className="panel h-40 animate-pulse" />}
        {status === "none" && <WalletSetup />}
        {status === "locked" && <UnlockVault />}
      </div>
    </div>
  );
}