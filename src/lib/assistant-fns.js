import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ACTION_IDS, ALL_ACTIONS } from "@/lib/assistant-actions";

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
    account: z.number().optional(),
    accounts: z.number().optional(),
    holdings: z.array(Holding).max(40),
  }),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().min(1).max(2000) }))
    .min(1)
    .max(12),
});

// Every task the assistant may start, described for the model.
const TASK_LIST = Object.entries(ALL_ACTIONS)
  .map(([id, item]) => `- ${id}: ${item.help}`)
  .join("\n");

// The only thing that leaves the device is the balance snapshot already shown
// on screen — never a phrase, a key or the PIN.
export const askAssistant = createServerFn({ method: "POST" })
  .validator(AskInput)
  .handler(async ({ data, context }) => {
    const holdings = data.context.holdings.length
      ? data.context.holdings
          .map(
            (item) =>
              `- ${item.symbol} (${item.name || item.symbol}) on ${item.chain}: ${item.balance} ≈ $${item.value.toFixed(2)}`,
          )
          .join("\n")
      : "- The wallet holds nothing right now.";

    const transcript = data.history
      .map((message) => `${message.role === "user" ? "User" : "You"}: ${message.text}`)
      .join("\n");

    const accountLine =
      data.context.accounts && data.context.accounts > 0
        ? `Open account: ${(data.context.account ?? 0) + 1} of ${data.context.accounts}`
        : "Accounts are not open yet.";

    const prompt = `You are Helix, the assistant built into a self-custody multichain crypto wallet app.
You can carry out real tasks in the app for the user, not just answer: open any screen and run the small tasks listed below.

Tasks you may start (use these ids exactly, at most 3, in the order they should run):
${TASK_LIST}

How to act:
- Use "actions" whenever the user asks you to do something, even loosely ("take me to swap", "hide my balances", "lock it", "copy my address", "next account", "show dapps").
- Choose the task that gets the user as far as possible, and say in "answer" what you did in one short sentence.
- For a transfer or a swap you open that screen and explain the steps; you can never sign, approve or move funds yourself.
- Never ask for a recovery phrase, private key or PIN. If asked about keys, remind them the phrase stays encrypted on this device.
- If nothing needs doing, answer normally and return an empty "actions" array.
- "switch_account" takes the account number in "arg".

Wallet snapshot
Total value: $${data.context.total.toFixed(2)}
24h change: ${data.context.changePct.toFixed(2)}%
${accountLine}
Holdings:
${holdings}

Conversation so far
${transcript}

Answer the last user message in the "answer" field. Reply in the same language the user wrote in. Be practical, warm and brief: at most 90 words, plain text, no markdown.`;

    const result = await context.getBase44().asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          answer: { type: "string" },
          actions: {
            type: "array",
            maxItems: 3,
            items: {
              type: "object",
              properties: {
                id: { type: "string", enum: ACTION_IDS },
                arg: { type: "string" },
                label: { type: "string" },
              },
              required: ["id"],
            },
          },
        },
        required: ["answer", "actions"],
      },
    });

    const answer = String(result?.answer || "").trim();
    if (!answer) throw new Error("The assistant had no answer.");

    // Anything outside the catalogue is dropped before it reaches the device.
    const actions = (Array.isArray(result?.actions) ? result.actions : [])
      .filter((action) => action && ACTION_IDS.includes(action.id))
      .slice(0, 3)
      .map((action) => ({ id: action.id, arg: action.arg || "", label: action.label || "" }));

    return { answer, actions };
  });