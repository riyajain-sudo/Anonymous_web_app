import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/helpers/sendverificationEmail';
import { signUpSchema } from '@/schemas/signUpSchema';
import { randomInt } from 'node:crypto';
import { readBoundedBody } from '@/lib/readBoundedBody';


export async function POST(request: Request) {
  try {
    const raw = await readBoundedBody(request, 8192);
    if (raw === null) return Response.json({ success: false, message: "Request too large" }, { status: 413 });
    const body = JSON.parse(raw);
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) return Response.json({ success: false, message: "Invalid registration details" }, { status: 400 });
    const { username, email, password } = parsed.data;
    await dbConnect();

    // Always generate a verification code
    const verifyCode = randomInt(100000, 1000000).toString();

    // Check if username is already taken
    const existingVerifiedUserByUsername = await UserModel.findOne({
      username,
      isVerified: true,
    });
    if (existingVerifiedUserByUsername) {
      return Response.json(
        { success: false, message: 'Username is already taken' },
        { status: 400 }
      );
    }

    // Check if email exists
    const existingUserByEmail = await UserModel.findOne({ email });

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return Response.json(
          { success: false, message: 'User already exists with this email' },
          { status: 400 }
        );
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUserByEmail.password = hashedPassword;
        existingUserByEmail.verifyCode = verifyCode;
        existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000); // 1 hour
        existingUserByEmail.verifyAttempts = 0;
        await existingUserByEmail.save();
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const expiryDate = new Date(Date.now() + 3600000); // 1 hour

      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode,
        verifyCodeExpiry: expiryDate,
        verifyAttempts: 0,
        isVerified: false,
        isAcceptingMessage: true,
        messages: [],
      });

      await newUser.save();
    }

    const emailResponse = await sendVerificationEmail(email, username, verifyCode);

    if (!emailResponse.success) {
      return Response.json(
        {
          success: false,
          message: emailResponse.message || 'Failed to send verification email',
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        message: 'User registered successfully. Please verify your account.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error registering user:', error.message, error.stack);
    return Response.json(
      {
        success: false,
        message: 'Error registering user',
      },
      { status: 500 }
    );
  }
}
