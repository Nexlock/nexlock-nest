import { z } from 'zod';

export const registerModuleToAdminSchema = z.object({
  otp: z.string().min(6).max(6, 'OTP must be exactly 6 characters'),
});

export type RegisterModuleToAdminDto = z.infer<
  typeof registerModuleToAdminSchema
>;
