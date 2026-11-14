import { useState } from "react";
import PageHeader from "@/components/wallet/PageHeader";
import AiProviderForm from "@/components/wallet/ai/AiProviderForm";
import { readAiSettings } from "@/lib/ai-settings";

export default function AiProviderSettings() {
  const [active, setActive] = useState(() => readAiSettings());

  return (
    <>
      <PageHeader
        eyebrow="Assistant"
        title="AI provider"
        description="Run the Helix assistant on your own ChatGPT or Claude key. The key stays in this browser and answers stop using Base44 integration credits."
      />

      <section className="panel mx-auto max-w-2xl p-4">
        <AiProviderForm initial={active} onSaved={setActive} />
      </section>

      <p className="mx-auto mt-3 max-w-2xl px-1 text-[10.5px] leading-relaxed text-muted-foreground/70">
        The key is stored on this device only and is sent straight to the provider you pick — never to Base44. Switch
        back to the built-in model and save to clear it.
      </p>
    </>
  );
}