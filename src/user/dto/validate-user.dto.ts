import { z } from 'zod';

export const validateUserSchema = z.object({
  id: z.string(),
  email: z.string().email().max(256),
  name: z.string().min(2).max(64),
});

export type ValidateUserDto = z.infer<typeof validateUserSchema>;
