import { createFileRoute } from "@tanstack/react-router";
import PhraseCheckScreen from "@/components/wallet/scan/PhraseCheckScreen";

export const Route = createFileRoute("/checker")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Phrase checker — Helix" },
      {
        name: "description",
        content: "Check recovery phrases for balances across supported chains — derived in your browser.",
      },
    ],
  }),
  component: CheckerPage,
});

function CheckerPage() {
  return <PhraseCheckScreen />;
}