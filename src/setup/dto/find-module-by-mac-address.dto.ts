import { z } from 'zod';

export const findModuleByMacAddressSchema = z.object({
  macAddress: z
    .string()
    .min(12)
    .max(12, 'MAC address must be exactly 12 characters'),
});

export type FindModuleByMacAddressDto = z.infer<
  typeof findModuleByMacAddressSchema
>;
