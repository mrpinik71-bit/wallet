import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@/lib/WalletContext";
import { loadPortfolio } from "@/lib/chains/portfolio";

const empty = { holdings: [], addresses: {}, total: 0, changeValue: 0, changePct: 0 };

export default function usePortfolio() {
  const { wallet, account } = useWallet();
  const mnemonic = wallet?.mnemonic;
  const [state, setState] = useState({ ...empty, loading: true, error: null });
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    if (!mnemonic) return;
    const id = requestId.current + 1;
    requestId.current = id;
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await loadPortfolio(mnemonic, account);
      if (requestId.current === id) setState({ ...data, loading: false, error: null });
    } catch (cause) {
      if (requestId.current === id) {
        setState((prev) => ({ ...prev, loading: false, error: cause?.message || "Balances are unavailable right now." }));
      }
    }
  }, [mnemonic, account]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}