import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/wallet/PageHeader";
import WalletSetup from "@/components/wallet/setup/WalletSetup";
import UnlockVault from "@/components/wallet/setup/UnlockVault";
import WalletHome from "@/components/wallet/setup/WalletHome";
import { useWallet } from "@/lib/WalletContext";

export const Route = createFileRoute("/_authed/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet security — Helix" },
      { name: "description", content: "Create, restore and protect your self-custody recovery phrase." },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const { status } = useWallet();

  return (
    <>
      <PageHeader
        eyebrow="Keys"
        title="Wallet security"
        description="Your recovery phrase is created and encrypted on this device. It is never sent to a server and never stored in our database."
      />
      {status === "loading" && <div className="panel mx-auto h-40 max-w-2xl animate-pulse" />}
      {status === "none" && <WalletSetup />}
      {status === "locked" && <UnlockVault />}
      {status === "unlocked" && <WalletHome />}
    </>
  );
}