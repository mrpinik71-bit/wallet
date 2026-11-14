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
You can read the snapshot below and perform small app actions for the user. Pick exactly one action per reply when it helps:
- "refresh" — reload the on-chain balances
- "send" — open the Send screen
- "receive" — open the Receive screen
- "swap" — open the Swap screen
- "markets" — open the Markets screen
- "activity" — open the Activity screen
- "copy_address" — copy the user's receiving address to the clipboard
- "none" — no action (plain answer)
You cannot move, sign or approve funds yourself: for a transfer or a swap, open the matching screen instead.
Never ask for a recovery phrase, private key or PIN, and never mention them beyond a one-line safety reminder.
Be practical, warm and brief: at most 90 words, plain text, no markdown, no bullet symbols other than dashes.

Wallet snapshot
Total value: $${data.context.total.toFixed(2)}
24h change: ${data.context.changePct.toFixed(2)}%
Holdings:
${holdings}

Conversation so far
${transcript}

Answer the last user message in the "answer" field. Reply in the same language the user wrote in. If the message is a greeting or small talk, answer briefly and offer one useful thing you can do. Fill "action" with the chosen action and "action_label" with a 3-5 word label of what you did (empty for "none").`;

    const result = await context.getBase44().asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          answer: { type: "string" },
          action: {
            type: "string",
            enum: ["none", "refresh", "send", "receive", "swap", "markets", "activity", "copy_address"],
          },
          action_label: { type: "string" },
        },
        required: ["answer", "action"],
      },
    });

    const answer = String(result?.answer || "").trim();
    if (!answer) throw new Error("The assistant had no answer.");
    return { answer, action: result?.action || "none", actionLabel: result?.action_label || "" };
  });