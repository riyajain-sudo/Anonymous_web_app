import { z } from "zod";

export const messageSchema = z.object({
  content: z.string().trim().min(10, "Message must be at least 10 characters").max(300, "Message must be at most 300 characters"),
}).strict();
