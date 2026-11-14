import { createFileRoute } from "@tanstack/react-router";
import AiProviderSettings from "@/components/wallet/ai/AiProviderSettings";

export const Route = createFileRoute("/_authed/ai-settings")({
  head: () => ({
    meta: [
      { title: "AI provider — Helix" },
      { name: "description", content: "Point the Helix assistant at your own OpenAI or Anthropic API key." },
    ],
  }),
  component: AiProviderSettings,
});