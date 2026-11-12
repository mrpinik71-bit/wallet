import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AuthGateError, requireSignedIn } from "@/components/auth/AuthGate";
import WalletShell from "@/components/WalletShell";
import { WalletProvider } from "@/lib/WalletContext";

export const Route = createFileRoute("/_authed")({
  ssr: false,
  beforeLoad: requireSignedIn,
  errorComponent: AuthGateError,
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <WalletProvider>
      <WalletShell>
        <Outlet />
      </WalletShell>
    </WalletProvider>
  );
}