import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import {User} from "next-auth";
import { Message } from '@/model/User';
import mongoose from "mongoose";


export async function DELETE(
    request: Request,
    {params}: {params: {messageid: string}}
){
    const messageId = params.messageid
    await dbConnect()
    const session = await getServerSession(authOptions)
        const _user: User | undefined = session?.user
    
    if(!session || !session.user){
        return Response.json(
            {
                success: false,
                message: "User not logged in!"
            },
            {status: 401}
        )
    }
    if (!mongoose.Types.ObjectId.isValid(String(_user?._id)) || !mongoose.Types.ObjectId.isValid(messageId)) {
        return Response.json({ success: false, message: "Invalid message or account" }, { status: 400 });
    }
    try {
        const updatedResult = await UserModel.updateOne(
            {_id: _user._id, "messages._id": messageId},
            {$pull: {messages: {_id: messageId}}}
        )
        if(updatedResult.modifiedCount == 0){
            return Response.json({
                success: false,
                message: 'Message not found or already deleted'
            },
            {status: 404}
        )
    }
     return Response.json({
                success: true,
                message: 'Message deleted succesfully!'
            },
            {status: 200}
        )

    } catch (error) {
        return Response.json({
            success: false,
            message: 'Error deleting the message'
        },{status: 500}
    )
    }
}
    