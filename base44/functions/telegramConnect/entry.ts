import { createClientFromRequest } from "npm:@base44/sdk";
import { secrets } from "base44:runtime";

const token = () => secrets.get("TELEGRAM_BOT_TOKEN") as string | undefined;

async function tg(method: string, body?: BodyInit, json = false) {
  const key = token();
  if (!key) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  const options: RequestInit = { method: "POST" };
  if (body !== undefined) {
    options.body = body;
    if (json) options.headers = { "content-type": "application/json" };
  }
  const response = await fetch(`https://api.telegram.org/bot${key}/${method}`, options);
  const payload = await response.json().catch(() => ({}));
  if (!payload.ok) throw new Error(payload.description || `Telegram ${method} failed`);
  return payload.result;
}

// A stable, opaque /start payload that belongs to one account.
function linkCode(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  return `h${hash.toString(36)}${userId.replace(/-/g, "").slice(-6)}`;
}

// Finds the chat that pressed Start with this account's own code.
async function findChat(userId: string) {
  const code = linkCode(userId);
  const updates = (await tg("getUpdates", JSON.stringify({ limit: 100, allowed_updates: ["message"] }), true)) as any[];
  for (const update of updates) {
    const message = update.message;
    const text = String(message?.text || "");
    if (!text.startsWith("/start")) continue;
    if (!text.trim().endsWith(code)) continue;
    return {
      chatId: String(message.chat.id),
      username: message.chat.username || message.chat.first_name || "",
    };
  }
  return null;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const record = await base44.asServiceRole.entities.User.get(user.id);

    if (body?.action === "status") {
      return Response.json({
        connected: Boolean(record?.telegram_chat_id),
        username: record?.telegram_username || "",
      });
    }

    const found = await findChat(user.id).catch(() => null);
    if (found) {
      await base44.asServiceRole.entities.User.update(user.id, {
        telegram_chat_id: found.chatId,
        telegram_username: found.username,
      });
      return Response.json({ connected: true, username: found.username });
    }

    const me = (await tg("getMe")) as { username: string };
    return Response.json({
      connected: false,
      botUsername: me.username,
      deepLink: `https://t.me/${me.username}?start=${linkCode(user.id)}`,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}