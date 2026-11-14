import usePortfolio from "@/hooks/usePortfolio";
import AgentChat from "@/components/wallet/agent/AgentChat";

export default function AgentScreen() {
  const { holdings, total, changePct, addresses, refresh } = usePortfolio();

  return (
    <div className="mx-auto w-full max-w-[520px] lg:max-w-[720px]">
      <AgentChat
        page
        holdings={holdings}
        total={total}
        changePct={changePct}
        onRefresh={refresh}
        address={addresses.tron}
      />
      <p className="mt-4 text-center text-[8.5px] font-medium uppercase tracking-[0.24em] text-muted-foreground/40">
        Your key and phrase never leave this device
      </p>
    </div>
  );
}