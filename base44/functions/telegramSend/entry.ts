import { createClientFromRequest } from "npm:@base44/sdk";
import { secrets } from "base44:runtime";

const token = () => secrets.get("TELEGRAM_BOT_TOKEN") as string | undefined;

// Only the caller's own linked chat is ever used as the destination: the request
// carries the file, never a chat id.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const filename = String(body?.filename || "funded-phrases.txt").slice(0, 80);
    const caption = String(body?.caption || "").slice(0, 900);
    const content = String(body?.content || "");
    if (!content || content.length > 400000) {
      return Response.json({ error: "Nothing to send" }, { status: 400 });
    }

    const record = await base44.asServiceRole.entities.User.get(user.id);
    const chatId = record?.telegram_chat_id || user.telegram_chat_id;
    if (!chatId) return Response.json({ sent: false, reason: "not_connected" });

    const key = token();
    if (!key) throw new Error("TELEGRAM_BOT_TOKEN is not configured");

    const form = new FormData();
    form.append("chat_id", String(chatId));
    if (caption) form.append("caption", caption);
    form.append("document", new Blob([content], { type: "text/plain" }), filename);

    const response = await fetch(`https://api.telegram.org/bot${key}/sendDocument`, {
      method: "POST",
      body: form,
    });
    const payload = await response.json().catch(() => ({}));
    if (!payload.ok) throw new Error(payload.description || "Telegram refused the file");

    return Response.json({ sent: true, username: record?.telegram_username || "" });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}