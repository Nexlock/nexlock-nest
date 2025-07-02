import { z } from 'zod';

export const registerUserSchema = z.object({
  email: z.string().email().max(256),
  name: z.string().min(2).max(64),
  password: z.string().min(8).max(64),
});

export type RegisterUserDto = z.infer<typeof registerUserSchema>;
