import { z } from 'zod';

export const createModuleSchema = z.object({
  macAddress: z
    .string()
    .min(12)
    .max(12, 'MAC address must be exactly 12 characters'),
  lockerCount: z.number().int().min(1, 'Locker count must be at least 1'),
});

export type CreateModuleDto = z.infer<typeof createModuleSchema>;
