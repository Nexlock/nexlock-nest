import { z } from 'zod';

export const searchByLocationSchema = z.object({
  latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180)
    .max(180, 'Longitude must be between -180 and 180'),
  radius: z
    .number()
    .min(0, 'Radius must be a positive number')
    .max(180, 'Radius must not exceed latitude/longitude limits')
    .default(0.008983),
});

export type SearchByLocationDto = z.infer<typeof searchByLocationSchema>;
