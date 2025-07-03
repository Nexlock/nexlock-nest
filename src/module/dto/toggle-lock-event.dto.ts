import { z } from 'zod';

export const toggleLockEventSchema = z.object({
  macAddress: z.string().min(1, 'Module ID is required'),
  lockerId: z.string().min(1, 'Locker ID is required'),
  isOpen: z.boolean(),
});

export type ToggleLockEventDto = z.infer<typeof toggleLockEventSchema>;
