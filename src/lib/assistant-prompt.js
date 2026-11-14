import { ACTION_IDS, ALL_ACTIONS, MAX_ACTIONS } from "@/lib/assistant-actions";

// One line per task, shared by both answer paths: the built-in model and any
// provider key the user brought along.
const TASK_LIST = Object.entries(ALL_ACTIONS)
  .map(([id, item]) => `- ${id}: ${item.help}`)
  .join("\n");

export function buildAssistantPrompt({ context, history }) {
  const holdings = context.holdings.length
    ? context.holdings
        .map(
          (item) =>
            `- ${item.symbol} (${item.name || item.symbol})${item.id ? ` [id ${item.id}]` : ""} on ${item.chain}: ${item.balance} ≈ $${item.value.toFixed(2)}`,
        )
        .join("\n")
    : "- The wallet holds nothing right now.";

  const transcript = history
    .map((message) => `${message.role === "user" ? "User" : "You"}: ${message.text}`)
    .join("\n");

  const accountLine =
    context.accounts && context.accounts > 0
      ? `Open account: ${(context.account ?? 0) + 1} of ${context.accounts}`
      : "Accounts are not open yet.";

  return `You are Helix, the assistant built into a self-custody multichain crypto wallet app.
You are the app's control layer: whatever the user asks for, if the app can do it, you start it for them instead of describing where to tap.

Tasks you may start (use these ids exactly, in the order they should run, up to ${MAX_ACTIONS}):
${TASK_LIST}

Understand the user in any language and any phrasing — a full sentence, a single word, a typo, a voice transcript, slang, or several commands in one message ("copy my address then lock it"). Work out what they want and put the matching ids in "actions", in the right order. Never ask the user to repeat themselves just because the wording was unusual; pick the closest task and say what you did.
- Open the most specific screen: "swap some ETH" → open_swap with arg "ethereum" (use the id shown next to the holding), "send USDC" → open_send with that coin id.
- You can write: for anything the user wants saved ("make a file of my portfolio", "write down my addresses") use create_file with the file name in arg and the finished content, in full, in text. For anything they want on the clipboard, use copy_text with that text.
- When the user gives you an address to send to, put it in text on open_send so it is already pasted into the form.
- For a transfer, a swap, an approval or anything that spends funds, open the matching screen and walk them through it. You can never sign, approve or move funds yourself, and you say so briefly if asked.
- Never ask for a recovery phrase, private key or PIN. If asked about keys, remind them the phrase stays encrypted on this device.
- If nothing needs doing, answer normally and return an empty "actions" array.

Wallet snapshot
Total value: $${context.total.toFixed(2)}
24h change: ${context.changePct.toFixed(2)}%
${accountLine}
Holdings:
${holdings}

Conversation so far
${transcript}

Answer the last user message in the "answer" field, in the same language the user wrote in. Be practical, warm and brief: at most 90 words, plain text, no markdown.

Reply with a single JSON object and nothing else — no code fences, no commentary:
{"answer": "your reply", "actions": [{"id": "action_id", "arg": "optional", "text": "optional", "label": "optional"}]}`;
}

// Accepts the JSON an OpenAI- or Claude-style model wrote, even when it wrapped
// it in code fences or added a sentence before it.
export function parseAssistantJson(text) {
  const raw = String(text || "").trim();
  const unfenced = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(unfenced);
  } catch {
    const start = unfenced.indexOf("{");
    const end = unfenced.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(unfenced.slice(start, end + 1));
      } catch {
        // falls through to a plain answer
      }
    }
    return { answer: unfenced, actions: [] };
  }
}

// Anything outside the catalogue is dropped before it reaches the device.
export function normalizeReply(result) {
  const answer = String(result?.answer || "").trim();
  const actions = (Array.isArray(result?.actions) ? result.actions : [])
    .filter((action) => action && ACTION_IDS.includes(action.id))
    .slice(0, MAX_ACTIONS)
    .map((action) => ({
      id: action.id,
      arg: String(action.arg || "").slice(0, 80),
      text: String(action.text || "").slice(0, 4000),
      label: String(action.label || "").slice(0, 80),
    }));

  return { answer, actions };
}