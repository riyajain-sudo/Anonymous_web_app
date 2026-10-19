import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { verifySchema } from "@/schemas/verifySchema";
import { readBoundedBody } from "@/lib/readBoundedBody";

export async function POST(request: Request) {
  try {
    const raw = await readBoundedBody(request, 1024);
    if (raw === null) return Response.json({ success: false, message: "Request too large" }, { status: 413 });
    const body = JSON.parse(raw);
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) return Response.json({ success: false, message: "Invalid verification request" }, { status: 400 });
    const username = decodeURIComponent(parsed.data.username);
    await dbConnect();
    const user = await UserModel.findOneAndUpdate(
      { username, verifyCode: parsed.data.code, verifyCodeExpiry: { $gt: new Date() }, isVerified: false, $or: [{ verifyAttempts: { $lt: 5 } }, { verifyAttempts: { $exists: false } }] },
      { $set: { isVerified: true, verifyCode: "", verifyCodeExpiry: new Date(0) } },
      { new: true },
    );
    if (user) return Response.json({ success: true, message: "Account verified!" }, { status: 200 });
    await UserModel.updateOne({ username, isVerified: false, $or: [{ verifyAttempts: { $lt: 5 } }, { verifyAttempts: { $exists: false } }] }, { $inc: { verifyAttempts: 1 } });
    return Response.json({ success: false, message: "Invalid, expired, or locked code" }, { status: 400 });
  } catch (error) {
    console.error("Error verifying user", error);
    return Response.json({ success: false, message: "Error verifying user" }, { status: 500 });
  }
}
