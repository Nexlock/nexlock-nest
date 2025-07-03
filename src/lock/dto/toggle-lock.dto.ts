import { z } from 'zod';

export const toggleLockSchema = z.object({
  lockerId: z.string().min(1, 'Locker ID is required'),
  macAddress: z.string().min(1, 'MAC Address is required'),
  isOpen: z.boolean().optional(),
});

export type ToggleLockDto = z.infer<typeof toggleLockSchema>;
