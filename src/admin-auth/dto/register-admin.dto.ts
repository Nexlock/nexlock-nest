import { z } from 'zod';

export const registerAdminSchema = z.object({
  email: z.string().email().max(256),
  password: z.string().min(8).max(64),
  name: z.string().min(2).max(64),
  code: z.string().max(6),
});

export type RegisterAdminDto = z.infer<typeof registerAdminSchema>;
