// Calls the user's own provider straight from this device. The key is read from
// local storage and only ever sent to the provider it belongs to.
import { AI_PROVIDERS } from "@/lib/ai-settings";

export async function callProvider(settings, prompt) {
  const config = AI_PROVIDERS[settings.provider];
  if (!config || settings.provider === "base44") throw new Error("Choose a provider first.");
  if (!settings.apiKey) throw new Error("Paste your API key first.");
  if (!settings.model) throw new Error("Name the model you want to use.");

  const text =
    settings.provider === "anthropic"
      ? await callAnthropic(settings, prompt)
      : await callOpenAiCompatible(settings, prompt);

  if (!String(text || "").trim()) throw new Error("The provider returned an empty answer.");
  return text;
}

async function callOpenAiCompatible(settings, prompt) {
  const base = (settings.baseUrl || AI_PROVIDERS[settings.provider].baseUrl || "https://api.openai.com/v1").replace(
    /\/+$/,
    "",
  );
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${settings.apiKey}` },
    body: JSON.stringify({
      model: settings.model,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const payload = await readJson(response);
  return payload?.choices?.[0]?.message?.content || "";
}

async function callAnthropic(settings, prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": settings.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: settings.model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const payload = await readJson(response);
  return (Array.isArray(payload?.content) ? payload.content : [])
    .filter((part) => part?.type === "text")
    .map((part) => part.text)
    .join("");
}

async function readJson(response) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.error?.message || payload?.message || `The provider refused the request (${response.status}).`;
    throw new Error(message);
  }

  return payload;
}