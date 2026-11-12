import { createContext, useContext, useEffect, useState } from "react";
import { clearVault, openVault, readVaultMeta, saveVault } from "@/lib/vault";

const WalletContext = createContext(null);

// Which account of the phrase is open, and how many have been created. Both
// survive a reload so the wallet comes back on the account you were using.
const ACCOUNT_KEY = "helix.account";
const COUNT_KEY = "helix.accountCount";

const stored = (key, fallback) => {
  const value = Number(window.localStorage.getItem(key));
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

export function WalletProvider({ children }) {
  const [status, setStatus] = useState("loading");
  const [wallet, setWallet] = useState(null);
  const [account, setAccountState] = useState(0);
  const [accounts, setAccounts] = useState(1);

  useEffect(() => {
    setStatus(readVaultMeta() ? "locked" : "none");
    setAccountState(stored(ACCOUNT_KEY, 1) - 1);
    setAccounts(stored(COUNT_KEY, 1));
  }, []);

  function setAccount(index) {
    setAccountState(index);
    window.localStorage.setItem(ACCOUNT_KEY, String(index + 1));
  }

  function addAccount() {
    const next = accounts + 1;
    setAccounts(next);
    window.localStorage.setItem(COUNT_KEY, String(next));
    setAccount(next - 1);
  }

  const value = {
    status,
    wallet,
    account,
    accounts,
    setAccount,
    addAccount,
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
      setAccount(0);
      setAccounts(1);
      window.localStorage.setItem(COUNT_KEY, "1");
    },
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used inside WalletProvider");
  return context;
}