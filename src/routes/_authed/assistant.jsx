import { createFileRoute } from "@tanstack/react-router";
import AgentScreen from "@/components/wallet/agent/AgentScreen";

export const Route = createFileRoute("/_authed/assistant")({
  head: () => ({
    meta: [
      { title: "AI Agent — Helix" },
      { name: "description", content: "An AI agent inside your wallet: any task, any topic, done in steps." },
    ],
  }),
  component: AgentScreen,
});