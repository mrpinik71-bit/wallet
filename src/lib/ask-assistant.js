import { buildAssistantPrompt, normalizeReply, parseAssistantJson } from "@/lib/assistant-prompt";
import { callProvider } from "@/lib/ai-provider";
import { isOwnAiActive, readAiSettings } from "@/lib/ai-settings";

// When the user pointed the assistant at their own API, the answer comes
// straight from that provider on this device. Returns null when no own key is
// configured, so callers fall back to the built-in assistant.
export async function askWithOwnProvider({ context, history }) {
  const settings = readAiSettings();
  if (!isOwnAiActive(settings)) return null;

  const text = await callProvider(settings, buildAssistantPrompt({ context, history }));
  const reply = normalizeReply(parseAssistantJson(text));
  if (!reply.answer) throw new Error("The assistant had no answer.");
  return reply;
}