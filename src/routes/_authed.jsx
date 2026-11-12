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

  if (status === "locked") {
    return <UnlockVault />;
  }

  if (status === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return <WalletSetup />;
}