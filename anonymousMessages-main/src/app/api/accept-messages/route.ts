import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import {User} from "next-auth";
import { acceptMessageSchema } from "@/schemas/acceptMessageSchema";
import { readBoundedBody } from "@/lib/readBoundedBody";

export async function POST(request: Request){
    await dbConnect()

    const session = await getServerSession(authOptions)
    const user: User = session?.user

    if(!session || !session.user){
        return Response.json(
            {
                success: false,
                message: "User not logged in!"
            }, 
            {status: 401}
        )
    }
    const userId = user._id;
    const raw = await readBoundedBody(request, 1024)
    if (raw === null) return Response.json({success: false, message: "Request too large"}, {status: 413})
    let body: unknown
    try { body = JSON.parse(raw) } catch { return Response.json({success: false, message: "Invalid JSON"}, {status: 400}) }
    const parsed = acceptMessageSchema.safeParse(body)
    if (!parsed.success) return Response.json({success: false, message: "Invalid preference"}, {status: 400})
    const {acceptMessages} = parsed.data

    try {
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            {isAcceptingMessage: acceptMessages},
            {new: true}
        )
        if(!updatedUser){
            return Response.json(
            {
                success: false,
                message: "failed to update user status to accept messages"
            },
            {status: 401})
        }

        return Response.json(
            {
                success: true,
                message: "user messaging status updated!",
                isAcceptingMessages: updatedUser.isAcceptingMessage
            },
            {status: 200}
        )

    } catch (error) {
        console.log("failed to update user status to accept messages")
        return Response.json(
            {
                success: false,
                message: "failed to update user status to accept messages"
            },
            {status: 500}
        )
    }

}

export async function GET(request: Request){
    await dbConnect()

    const session = await getServerSession(authOptions)
    const user: User = session?.user

    if(!session || !session.user){
        return Response.json(
            {
                success: false,
                message: "User not logged in!"
            },
            {status: 401}
        )
    }
    const userId = user._id;

    try {
        const foundUser = await UserModel.findById(userId)
        if(!foundUser){
            return Response.json(
                {
                    success: false,
                    message: "failed to find user to accept messages"
                },
                {status: 404}
            )
        }
    
        return Response.json(
            {
                success: true,
                isAcceptingMessages: foundUser.isAcceptingMessage
            },
            {status: 200}
        )
    } catch (error) {
        console.log("message acceptance error")
        return Response.json(
            {
                success: false,
                message: "message acceptance error"
            },
            {status: 500}
        )
    }
}