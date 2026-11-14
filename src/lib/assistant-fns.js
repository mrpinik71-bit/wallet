import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";

const Holding = z.object({
  symbol: z.string().max(20),
  name: z.string().max(60).optional(),
  chain: z.string().max(40),
  balance: z.number(),
  value: z.number(),
});

const AskInput = z.object({
  context: z.object({
    total: z.number(),
    changePct: z.number(),
    holdings: z.array(Holding).max(40),
  }),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().min(1).max(2000) }))
    .min(1)
    .max(12),
});

// The only thing that leaves the device is the balance snapshot already shown
// on screen — never a phrase, a key or the PIN.
export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(AskInput)
  .handler(async ({ data, context }) => {
    const holdings = data.context.holdings.length
      ? data.context.holdings
          .map((item) => `- ${item.symbol} (${item.name || item.symbol}) on ${item.chain}: ${item.balance} ≈ $${item.value.toFixed(2)}`)
          .join("\n")
      : "- The wallet holds nothing right now.";

    const transcript = data.history
      .map((message) => `${message.role === "user" ? "User" : "You"}: ${message.text}`)
      .join("\n");

    const prompt = `You are Helix, the assistant inside a self-custody multichain crypto wallet app.
You can only read the snapshot below. You cannot move, send, swap or sign anything — when asked to do so, point the user to the Send, Receive or Swap screen.
Never ask for a recovery phrase, private key or PIN, and never mention them beyond a one-line safety reminder.
Be practical, warm and brief: at most 90 words, plain text, no markdown, no bullet symbols other than dashes.

Wallet snapshot
Total value: $${data.context.total.toFixed(2)}
24h change: ${data.context.changePct.toFixed(2)}%
Holdings:
${holdings}

Conversation so far
${transcript}

Answer the last user message. Reply in the same language the user wrote in. If the message is a greeting or small talk, answer briefly and offer one useful thing you can do.`;

    const answer = await context.getBase44().asServiceRole.integrations.Core.InvokeLLM({ prompt });
    return { answer: String(answer || "").trim() };
  });