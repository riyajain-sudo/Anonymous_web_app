import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { messageSchema } from "@/schemas/messageSchema";
import { z } from "zod";
import { readBoundedBody } from "@/lib/readBoundedBody";

const requestSchema = z.object({
  username: z.string().trim().min(1).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  content: messageSchema.shape.content,
}).strict();
const MAX_BODY_BYTES = 8 * 1024;

export async function POST(request: Request) {
  try {
    const raw = await readBoundedBody(request, MAX_BODY_BYTES);
    if (raw === null) {
      return Response.json({ success: false, message: "Request too large" }, { status: 413 });
    }
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return Response.json({ success: false, message: "Invalid JSON" }, { status: 400 }); }
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) return Response.json({ success: false, message: "Invalid message" }, { status: 400 });
    await dbConnect();
    const { username, content } = parsed.data;
    const result = await UserModel.updateOne(
      { username, isAcceptingMessage: true, "messages.99": { $exists: false } },
      { $push: { messages: { $each: [{ content, createdAt: new Date() }], $slice: -100 } } },
    );
    if (result.modifiedCount === 1) return Response.json({ success: true, message: "Message sent!" }, { status: 200 });
    const recipient = await UserModel.exists({ username });
    if (!recipient) return Response.json({ success: false, message: "User not found!" }, { status: 404 });
    const accepting = await UserModel.exists({ username, isAcceptingMessage: true });
    if (!accepting) return Response.json({ success: false, message: "User is not accepting messages" }, { status: 403 });
    return Response.json({ success: false, message: "Inbox is full" }, { status: 429 });
  } catch (error) {
    console.error("Error sending message", error);
    return Response.json({ success: false, message: "Error sending messages" }, { status: 503 });
  }
}
