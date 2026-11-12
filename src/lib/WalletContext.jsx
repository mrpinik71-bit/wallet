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
    async create({ mnemonic, wordCount, password }) {
      const opened = await saveVault({ mnemonic, wordCount, password });
      setWallet(opened);
      setStatus("unlocked");
    },
    async unlock(password) {
      const opened = await openVault(password);
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