import { z } from 'zod';

export const validateAdminSchema = z.object({
  id: z.string(),
  email: z.string().email().max(256),
  name: z.string().min(2).max(64),
});

export type ValidateAdminDto = z.infer<typeof validateAdminSchema>;
