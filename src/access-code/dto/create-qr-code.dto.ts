import { z } from 'zod';

export const CreateQrCodeSchema = z.object({
  lockerRentalId: z.string().min(1, 'Locker Rental ID is required'),
});

export type CreateQrCodeDto = z.infer<typeof CreateQrCodeSchema>;
