// Telegram delivery straight from the browser. The bot token the user pastes is
// kept in this browser only (never in the build), so the same page works on any
// static host — Vercel included — with no server involved.
const TOKEN_KEY = "helix.telegram.token";
const CHAT_KEY = "helix.telegram.chat";

export function savedBot() {
  try {
    return {
      token: localStorage.getItem(TOKEN_KEY) || "",
      chatId: localStorage.getItem(CHAT_KEY) || "",
    };
  } catch {
    return { token: "", chatId: "" };
  }
}

export function saveBotToken(raw) {
  const token = String(raw || "").trim();
  if (!/^\d{6,}:[\w-]{30,}$/.test(token)) {
    throw new Error("That is not a bot token. Copy it from @BotFather (it looks like 1234567:ABC…).");
  }
  localStorage.setItem(TOKEN_KEY, token);
  return token;
}

export function saveChatId(id) {
  localStorage.setItem(CHAT_KEY, String(id));
}

export function forgetBot() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CHAT_KEY);
}

async function call(token, method, body) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, body ? { method: "POST", body } : undefined);
  const data = await response.json().catch(() => ({}));
  if (!data.ok) throw new Error(data.description || "Telegram rejected that request.");
  return data.result;
}

/** Reads the newest message sent to the bot, which gives the chat to deliver to. */
export async function detectChat(token) {
  const updates = await call(token, "getUpdates?limit=1&offset=-1");
  for (let index = updates.length - 1; index >= 0; index -= 1) {
    const message = updates[index].message || updates[index].edited_message;
    if (message && message.chat && message.chat.id) return String(message.chat.id);
  }
  return "";
}

export async function sendDocument(token, chatId, { filename, caption, content }) {
  const form = new FormData();
  form.append("chat_id", chatId);
  if (caption) form.append("caption", caption.slice(0, 1024));
  form.append("document", new Blob([content], { type: "text/plain;charset=utf-8" }), filename);
  return call(token, "sendDocument", form);
}