import { z } from 'zod';

export const verifyQrCodeSchema = z.object({
  qrCode: z.string().min(10).max(300),
});

export type VerifyQrCodeDto = z.infer<typeof verifyQrCodeSchema>;
