import { z } from 'zod';

export const installStatusDtoSchema = z.object({
  data: z.object({ isInstalled: z.boolean(), isTokenRequired: z.boolean(), isTokenConfigured: z.boolean() }),
});

export const installedDtoSchema = z.object({ data: z.object({ email: z.string() }) });
