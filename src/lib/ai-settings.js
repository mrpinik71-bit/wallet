// The assistant's provider choice lives on this device only — the key is never
// sent to Base44, so nothing depends on integration credits once it is set.
const STORAGE_KEY = "helix.ai.provider";
export const AI_SETTINGS_EVENT = "helix-ai-settings";

export const AI_PROVIDERS = {
  base44: {
    label: "Base44 (built in)",
    hint: "Works out of the box and uses Base44 integration credits.",
    models: [],
  },
  openai: {
    label: "OpenAI · ChatGPT",
    hint: "Your own OpenAI key, billed by OpenAI.",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1", "gpt-5-mini"],
    keysUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    label: "Anthropic · Claude",
    hint: "Your own Anthropic key, billed by Anthropic.",
    defaultModel: "claude-3-5-sonnet-latest",
    models: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest", "claude-sonnet-4-5"],
    keysUrl: "https://console.anthropic.com/settings/keys",
  },
  custom: {
    label: "Custom endpoint",
    hint: "Any OpenAI-compatible API — OpenRouter, Groq, a local model.",
    defaultModel: "",
    models: [],
    keysUrl: "",
  },
};

const EMPTY = { provider: "base44", apiKey: "", model: "", baseUrl: "" };

export function readAiSettings() {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    if (!stored || !AI_PROVIDERS[stored.provider]) return { ...EMPTY };
    return { ...EMPTY, ...stored };
  } catch {
    return { ...EMPTY };
  }
}

export function writeAiSettings(next) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(AI_SETTINGS_EVENT));
}

// True when a complete own-provider setup exists and can answer.
export function isOwnAiActive(settings = readAiSettings()) {
  return settings.provider !== "base44" && Boolean(settings.apiKey && settings.model);
}