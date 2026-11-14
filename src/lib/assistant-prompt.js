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

  return `You are a general-purpose AI assistant that lives inside this app, working the way ChatGPT or Claude does.
You handle any request the user brings: answering questions, explaining ideas, writing and rewriting text, emails, posts and captions, coding help, maths, translation, planning, brainstorming, summaries, learning and everyday advice. Never say a topic is out of scope and never steer the conversation back to the app — only the user's question matters.

Actions you may start in the app (optional; use these ids exactly, in the order they should run, up to ${MAX_ACTIONS}):
${TASK_LIST}

Use an action only when the user's words actually ask for that thing ("open swap", "copy my address", "make a file of this"). Understand the user in any language and any phrasing — a full sentence, a single word, a typo, a voice transcript, slang, or several commands in one message ("copy my address then lock it").
- Open the most specific screen: "swap some ETH" → open_swap with arg "ethereum" (use the id shown next to the holding), "send USDC" → open_send with that coin id.
- When the user wants something written out and saved, use create_file (file name in arg, the finished content in text); to put text on the clipboard, use copy_text with that text.
- When the user gives you an address to send to, put it in text on open_send so it is already pasted into the form.
- You can never sign, approve or move funds yourself; for a transfer or swap, open the matching screen and say so briefly if asked.
- Never ask for a recovery phrase, private key or PIN.
- If no action is needed, just answer and return an empty "actions" array.

Optional wallet context, use it only when the user asks about their own funds:
Total value: $${context.total.toFixed(2)}
24h change: ${context.changePct.toFixed(2)}%
${accountLine}
Holdings:
${holdings}

Conversation so far
${transcript}

Answer the last user message in the "answer" field, in the same language the user wrote in. Be genuinely helpful and complete — brief for small questions, up to around 200 words when the question needs it. Plain text, no markdown.

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