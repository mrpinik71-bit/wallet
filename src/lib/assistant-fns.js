import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ACTION_IDS, MAX_ACTIONS } from "@/lib/assistant-actions";
import { buildAssistantPrompt, normalizeReply } from "@/lib/assistant-prompt";

const Holding = z.object({
  id: z.string().max(40).optional(),
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

// The built-in path: used whenever the user has not brought their own provider
// key. Only the balance snapshot already on screen leaves the device — never a
// phrase, a key or the PIN.
export const askAssistant = createServerFn({ method: "POST" })
  .validator(AskInput)
  .handler(async ({ data, context }) => {
    const result = await context.getBase44().asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildAssistantPrompt(data),
      response_json_schema: {
        type: "object",
        properties: {
          answer: { type: "string" },
          actions: {
            type: "array",
            maxItems: MAX_ACTIONS,
            items: {
              type: "object",
              properties: {
                id: { type: "string", enum: ACTION_IDS },
                arg: { type: "string" },
                text: { type: "string" },
                label: { type: "string" },
              },
              required: ["id"],
            },
          },
        },
        required: ["answer", "actions"],
      },
    });

    const reply = normalizeReply(result);
    if (!reply.answer) throw new Error("The assistant had no answer.");
    return reply;
  });