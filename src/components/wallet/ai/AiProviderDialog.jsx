import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AiProviderForm from "@/components/wallet/ai/AiProviderForm";
import { readAiSettings } from "@/lib/ai-settings";

// Lets the assistant's provider be changed before the vault is unlocked, so a
// key can be set from the very first screen without opening the settings route.
export default function AiProviderDialog({ open, onOpenChange }) {
  const [active, setActive] = useState(() => readAiSettings());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-[22px] leading-tight">AI provider</DialogTitle>
          <DialogDescription className="text-[11.5px] leading-relaxed">
            Run the Helix assistant on your own ChatGPT or Claude key. The key stays in this browser.
          </DialogDescription>
        </DialogHeader>
        <AiProviderForm initial={active} onSaved={setActive} />
      </DialogContent>
    </Dialog>
  );
}