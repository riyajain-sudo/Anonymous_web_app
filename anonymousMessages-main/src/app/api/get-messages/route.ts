import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import {User} from "next-auth";
import mongoose from "mongoose";


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
    const userId = new mongoose.Types.ObjectId(user._id);    //convert string type of userId as ObjectId of mongoose

    try {
        const userData = await UserModel.aggregate([
            {$match: {_id: userId}},
            {$unwind: '$messages'},
            {$sort: {'messages.createdAt': -1}},
            {$group: {_id: '$_id', messages: {$push: '$messages'}}}
        ])
        if(!userData || userData.length === 0){
            return Response.json(
                {
                    success: false,
                    message: "User not found!"
                },
                {status: 401}
            )
        }

        return Response.json(
            {
                success: true,
                messages: userData[0].messages
            },
            {status: 200}
        );
    } catch (error) {
        console.log("Unexpected error occured", error)
        return Response.json(
            {
                success: false,
                message: "Internal Server error"
            },
            {status: 401}
        )
    }
}