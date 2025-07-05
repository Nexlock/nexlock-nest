import { z } from 'zod';

export const setupModuleInfoSchema = z.object({
  name: z
    .string()
    .min(4, 'Module name is required')
    .max(50, 'Module name must be less than 50 characters'),
  description: z
    .string()
    .min(1, 'Module description is required')
    .max(255, 'Description must be less than 255 characters'),
  location: z.string().min(2, 'Location is required'),
  latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180),
});

export type SetupModuleInfoDto = z.infer<typeof setupModuleInfoSchema>;
