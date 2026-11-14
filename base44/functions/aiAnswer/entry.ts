import { createClientFromRequest } from "npm:@base44/sdk";

// The assistant's built-in answer, served from the app's backend so it works on
// any host — including the static Vercel build, where app server functions do
// not exist. Open to anonymous callers: the wallet has no login of its own.
export default async function (req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt || "");
    if (!prompt.trim()) return Response.json({ error: "Nothing to ask" }, { status: 400 });
    if (prompt.length > 60000) return Response.json({ error: "That message is too long" }, { status: 413 });

    const base44 = createClientFromRequest(req);
    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          answer: { type: "string" },
          actions: {
            type: "array",
            maxItems: 8,
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
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

    const answer = typeof reply === "string" ? reply : String((reply as any)?.answer || "");
    const actions = typeof reply === "string" ? [] : Array.isArray((reply as any)?.actions) ? (reply as any).actions : [];
    if (!answer.trim()) return Response.json({ error: "The assistant had no answer" }, { status: 502 });

    return Response.json({ answer, actions });
  } catch (error) {
    return Response.json({ error: String((error as Error)?.message || error).slice(0, 300) }, { status: 500 });
  }
}