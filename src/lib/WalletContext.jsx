import { createContext, useContext, useEffect, useState } from "react";
import { clearVault, openVault, readVaultMeta, saveVault } from "@/lib/vault";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [status, setStatus] = useState("loading");
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    setStatus(readVaultMeta() ? "locked" : "none");
  }, []);

  const value = {
    status,
    wallet,
    async create({ mnemonic, wordCount, pin }) {
      const opened = await saveVault({ mnemonic, wordCount, pin });
      setWallet(opened);
      setStatus("unlocked");
    },
    async unlock(pin) {
      const opened = await openVault(pin);
      setWallet(opened);
      setStatus("unlocked");
      return opened;
    },
    lock() {
      setWallet(null);
      setStatus(readVaultMeta() ? "locked" : "none");
    },
    erase() {
      clearVault();
      setWallet(null);
      setStatus("none");
    },
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used inside WalletProvider");
  return context;
}