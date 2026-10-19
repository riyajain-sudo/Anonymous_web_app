import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { z } from 'zod';
import { usernameValidation } from '@/schemas/signUpSchema';

const UsernameQuerySchema = z.object({
  username: usernameValidation,
});

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const queryParams = {
      username: searchParams.get('username')?.trim() ?? "",
    };

    // Validate using Zod
    const result = UsernameQuerySchema.safeParse(queryParams);

    if (!result.success) {
      // Collect detailed validation errors
      const usernameErrors = result.error.format().username?._errors || [];
      return Response.json(
        {
          success: false,
          message:
            usernameErrors.length > 0
              ? usernameErrors.join(', ')
              : 'Invalid username',
        },
        { status: 400 }
      );
    }

    const { username } = result.data;

    // Check if username already exists
    const existingVerifiedUser = await UserModel.findOne({
      username,
      isVerified: true,
    });

    if (existingVerifiedUser) {
      return Response.json(
        {
          success: false,
          message: 'Username is already taken',
        },
        { status: 200 }
      );
    }

    return Response.json(
      {
        success: true,
        message: 'Username is unique',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error checking username:", error.message, error.stack);
    return Response.json(
      {
        success: false,
        message: error.message || 'Unexpected server error',
      },
      { status: 500 }
    );
  }
}
