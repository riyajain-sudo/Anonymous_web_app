import { z } from "zod";
export const verifySchema = z.object({
  username: z.string().trim().min(1).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  code: z.string().regex(/^\d{6}$/),
}).strict();
