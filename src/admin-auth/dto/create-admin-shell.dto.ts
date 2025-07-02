import { z } from 'zod';

export const createAdminShellSchema = z.object({
  macAddress: z.string().max(24).optional(),
});

export type CreateAdminShellDto = z.infer<typeof createAdminShellSchema>;
