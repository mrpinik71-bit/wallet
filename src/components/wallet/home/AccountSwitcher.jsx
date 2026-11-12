import { useMemo } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/lib/WalletContext";
import { evmAddress } from "@/lib/chains/derive";

const short = (address) => (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "");

export default function AccountSwitcher() {
  const { wallet, account, accounts, setAccount, addAccount } = useWallet();

  // The EVM address tells the accounts apart at a glance.
  const labels = useMemo(() => {
    const mnemonic = wallet?.mnemonic || "";
    return Array.from({ length: accounts }, (_, index) => {
      try {
        return short(evmAddress(mnemonic, index));
      } catch {
        return "";
      }
    });
  }, [wallet?.mnemonic, accounts]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="mt-3 flex w-full items-center justify-between rounded-[18px] border border-foreground/[0.07] bg-foreground/[0.02] px-3.5 py-2.5 text-left transition-colors hover:border-foreground/15"
        >
          <span className="leading-none">
            <span className="block text-[9px] font-medium uppercase tracking-[0.24em] text-muted-foreground/60">
              Account
            </span>
            <span className="mt-1.5 block font-heading text-[13px] font-semibold">
              Account {account + 1}
              <span className="ml-2 font-mono text-[10px] font-normal text-muted-foreground num">
                {labels[account]}
              </span>
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-60">
        {labels.map((label, index) => (
          <DropdownMenuItem
            key={index}
            onSelect={() => setAccount(index)}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-[12px]">Account {index + 1}</span>
            <span className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground num">{label}</span>
              {account === index ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={addAccount} className="text-[12px]">
          <Plus className="mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
          Add account
        </DropdownMenuItem>
        <p className="px-2 pb-1.5 pt-1 text-[9.5px] leading-relaxed text-muted-foreground/55">
          Accounts come from the same recovery phrase · Polkadot and TON keep one address.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}