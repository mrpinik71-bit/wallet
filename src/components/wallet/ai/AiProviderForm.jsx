import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { AI_PROVIDERS, writeAiSettings } from "@/lib/ai-settings";
import { callProvider } from "@/lib/ai-provider";

const ORDER = ["base44", "openai", "anthropic", "custom"];
const PROBE = 'Reply with only this JSON: {"answer":"ok","actions":[]}';

const FIELD =
  "mt-1 w-full rounded-xl border border-foreground/[0.09] bg-background/60 px-3 py-2 text-[12px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/40";

export default function AiProviderForm({ initial, onSaved }) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const config = AI_PROVIDERS[draft.provider];
  const own = draft.provider !== "base44";

  const set = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

  function pick(provider) {
    if (provider === draft.provider) return;
    setNote(null);
    set({
      provider,
      model: AI_PROVIDERS[provider]?.defaultModel || "",
      baseUrl: provider === "custom" ? draft.baseUrl : "",
    });
  }

  function save() {
    const apiKey = draft.apiKey.trim();
    const model = draft.model.trim();
    if (own && !apiKey) return setNote({ bad: true, text: "Paste an API key first." });
    if (own && !model) return setNote({ bad: true, text: "Name the model you want to use." });

    const next = { provider: draft.provider, apiKey, model, baseUrl: (draft.baseUrl || "").trim() };
    writeAiSettings(next);
    onSaved?.(next);
    setNote({
      bad: false,
      text: own ? `Saved — the assistant now uses your ${config.label} key.` : "Saved — the assistant uses the built-in model.",
    });
  }

  async function test() {
    setBusy(true);
    setNote(null);
    try {
      await callProvider({ ...draft, apiKey: draft.apiKey.trim(), model: draft.model.trim() }, PROBE);
      setNote({ bad: false, text: `${config.label} answered — the key works.` });
    } catch (error) {
      setNote({ bad: true, text: error.message || "The provider refused the request." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1.5">
        {ORDER.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => pick(key)}
            className={`rounded-xl border px-3 py-2 text-left text-[11.5px] font-medium transition-colors ${
              draft.provider === key
                ? "border-primary/50 bg-primary/10 text-foreground"
                : "border-foreground/[0.08] text-muted-foreground hover:border-foreground/15 hover:text-foreground"
            }`}
          >
            {AI_PROVIDERS[key].label}
          </button>
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">{config.hint}</p>

      {own ? (
        <div className="space-y-3">
          <div>
            <label htmlFor="ai-key" className="eyebrow">
              API key
            </label>
            <input
              id="ai-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={draft.apiKey}
              onChange={(event) => set({ apiKey: event.target.value })}
              placeholder={draft.provider === "anthropic" ? "sk-ant-…" : "sk-…"}
              className={`${FIELD} font-mono`}
            />
            {config.keysUrl ? (
              <a
                href={config.keysUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-primary"
              >
                Get a key from {config.label}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ) : null}
          </div>

          <div>
            <label htmlFor="ai-model" className="eyebrow">
              Model
            </label>
            <input
              id="ai-model"
              value={draft.model}
              onChange={(event) => set({ model: event.target.value })}
              placeholder="model name"
              spellCheck={false}
              className={`${FIELD} font-mono`}
            />
            {config.models.length ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {config.models.map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => set({ model })}
                    className={`rounded-full border px-2.5 py-1 text-[10px] transition-colors ${
                      draft.model === model
                        ? "border-primary/40 text-primary"
                        : "border-foreground/[0.09] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {draft.provider === "custom" ? (
            <div>
              <label htmlFor="ai-base" className="eyebrow">
                Base URL
              </label>
              <input
                id="ai-base"
                value={draft.baseUrl || ""}
                onChange={(event) => set({ baseUrl: event.target.value })}
                placeholder="https://openrouter.ai/api/v1"
                spellCheck={false}
                className={`${FIELD} font-mono`}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {note ? (
        <p className={`text-[11px] leading-relaxed ${note.bad ? "text-destructive" : "text-primary"}`}>{note.text}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={save}
          className="rounded-xl bg-primary px-4 py-2 text-[11.5px] font-semibold text-primary-foreground active:opacity-90"
        >
          Save
        </button>
        {own ? (
          <button
            type="button"
            onClick={test}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-foreground/[0.1] px-4 py-2 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Test connection
          </button>
        ) : null}
      </div>
    </div>
  );
}