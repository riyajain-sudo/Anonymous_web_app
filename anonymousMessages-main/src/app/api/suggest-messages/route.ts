import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readBoundedBody } from "@/lib/readBoundedBody";

export const runtime = "edge";
export const maxDuration = 30;
const MAX_BODY_BYTES = 12 * 1024;
const MAX_MESSAGES = 8;
const MAX_TEXT_CHARS = 4000;
const MAX_OUTPUT_TOKENS = 256;
const WINDOW_MS = 60 * 60 * 1000;
const REQUESTS_PER_WINDOW = 10;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();
const textPartSchema = z.object({ type: z.literal("text"), text: z.string().max(MAX_TEXT_CHARS) });
const messageSchema = z.object({
  id: z.string().max(128),
  role: z.enum(["user", "assistant"]),
  parts: z.array(textPartSchema).min(1).max(8),
});
const requestSchema = z.object({ messages: z.array(messageSchema).max(MAX_MESSAGES).optional() }).strict();
const fallbackPrompt = "Create a list of three open-ended, friendly questions for an anonymous social messaging platform. Separate the three questions with ||. Avoid sensitive topics.";

function withinQuota(request: Request): boolean {
  const now = Date.now();
  // Use the ingress-provided client address. The hosting proxy must overwrite this header.
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const bucket = requestBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    if (requestBuckets.size > 10_000) {
      for (const [key, value] of requestBuckets) if (value.resetAt <= now) requestBuckets.delete(key);
      if (requestBuckets.size >= 10_000) return false;
    }
    return true;
  }
  if (bucket.count >= REQUESTS_PER_WINDOW) return false;
  bucket.count += 1;
  return true;
}

export async function POST(req: Request) {
  try {
    if (!withinQuota(req)) return NextResponse.json({ error: "Request quota exceeded" }, { status: 429 });
    const raw = await readBoundedBody(req, MAX_BODY_BYTES);
    if (raw === null) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid message history" }, { status: 400 });
    const messages = parsed.data.messages;
    if (messages && messages.reduce((sum, message) => sum + message.parts.reduce((n, part) => n + part.text.length, 0), 0) > MAX_TEXT_CHARS) {
      return NextResponse.json({ error: "Message history is too long" }, { status: 400 });
    }
    const result = await streamText({
      model: openai("gpt-4o"),
      messages: messages?.length ? convertToModelMessages(messages as UIMessage[]) : [{ role: "user", content: fallbackPrompt }],
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("AI suggestion request failed", error);
    return NextResponse.json({ error: "Suggestion service is temporarily unavailable" }, { status: 503 });
  }
}
