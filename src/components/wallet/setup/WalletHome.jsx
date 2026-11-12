import { useState } from "react";
import { CalendarDays, Eye, Lock, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import SeedGrid from "./SeedGrid";
import { useWallet } from "@/lib/WalletContext";
import { openVault } from "@/lib/vault";

const networks = ["Bitcoin", "Ethereum", "Solana", "Tron"];

export default function WalletHome() {
  const { wallet, lock, erase } = useWallet();
  const [password, setPassword] = useState("");
  const [phrase, setPhrase] = useState("");
  const [revealError, setRevealError] = useState("");

  async function reveal(event) {
    event.preventDefault();
    setRevealError("");
    try {
      const opened = await openVault(password);
      setPhrase(opened.mnemonic);
      setPassword("");
    } catch (err) {
      setRevealError(err.message);
    }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <section className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary">
              <ShieldCheck className="h-3 w-3" /> Wallet active
            </span>
            <h2 className="mt-3 font-heading text-xl font-semibold tracking-tight">
              {wallet.wordCount}-word recovery phrase
            </h2>
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              Created {new Date(wallet.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl">
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> Reveal phrase
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Confirm your password</DialogTitle>
                </DialogHeader>
                {phrase ? (
                  <SeedGrid mnemonic={phrase} />
                ) : (
                  <form onSubmit={reveal}>
                    <p className="text-[12px] leading-relaxed text-muted-foreground">
                      Make sure nobody can see your screen before revealing the phrase.
                    </p>
                    <Input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Wallet password"
                      className="mt-3 bg-secondary/40"
                      autoComplete="current-password"
                    />
                    {revealError && <p className="mt-2 text-[12px] text-destructive">{revealError}</p>}
                    <Button type="submit" className="mt-3 w-full rounded-xl">
                      Reveal recovery phrase
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
            <Button variant="ghost" onClick={lock} className="rounded-xl">
              <Lock className="mr-1.5 h-3.5 w-3.5" /> Lock
            </Button>
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-border/70 px-5 py-4">
          <h2 className="font-heading text-sm font-semibold tracking-tight">Networks</h2>
        </div>
        <ul className="divide-y divide-border/60">
          {networks.map((network) => (
            <li key={network} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-[13px]">{network}</span>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                Not connected
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-5">
        <h2 className="font-heading text-sm font-semibold tracking-tight">Encryption</h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
          Your phrase is sealed with AES-256-GCM using a key stretched from your password with
          PBKDF2-SHA256 (310,000 rounds). It is stored only on this device.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" /> Delete wallet from this device
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete this wallet?</DialogTitle>
            </DialogHeader>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              The encrypted phrase is erased from this device. Without your written backup the funds
              become unrecoverable.
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="destructive" className="flex-1 rounded-xl" onClick={erase}>
                Delete wallet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}