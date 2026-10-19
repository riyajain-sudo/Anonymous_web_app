import {resend} from "@/lib/resend"
import VerificationEmail from "../../emails/verificationEmail"
import { ApiResponse } from "@/types/ApiResponse"
// import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendVerificationEmail(
    email: string,
    username: string,
    verifyCode: string,
): Promise<ApiResponse>{
    try {
        const result = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Anonymous Message | Verification Code',
            react: VerificationEmail({username, otp: verifyCode}),
        });
        if (result.error) {
            console.error("verification email provider rejected request", result.error);
            return {success: false, message: "Failed to send verification email"};
        }
        return {success: true, message: "Success to send verification email"}
    } catch (emailerror) {
        console.error("error sending verification email", emailerror);
        return {success: false, message: "Failed to send verification email"}
    }
}