import {z} from "zod"

export const usernameValidation = z
    .string()
    .min(2, "Username must atleast 2 characters")
    .max(10, "must be within 10 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username must not contain any special characters")

export const signUpSchema = z.object({
    username: usernameValidation,
    email: z.string().email({message: 'Invalid email address'}),
    password: z.string().min(6,{message: "password must be atleast 6 characters"})
})
