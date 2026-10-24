import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { installedDtoSchema } from '~~/server/integrations/origo-api/dto/install.dto';

const MAX_BODY_BYTES = 2_048;

const installSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().toLowerCase().email().max(255),
    password: z.string().min(10).max(255),
    passwordConfirmation: z.string().max(255),
    token: z.string().trim().max(255).default(''),
  })
  .refine((value) => value.password === value.passwordConfirmation, { path: ['passwordConfirmation'], message: 'mismatch' });

export default defineApiHandler(async (event): Promise<{ email: string }> => {
  const { name, email, password, passwordConfirmation, token } = await readValidatedJsonBody(event, installSchema, MAX_BODY_BYTES);
  const response = await createOrigoApiClient(event)('/install', {
    method: 'POST',
    body: { name, email, password, password_confirmation: passwordConfirmation, token: token || null },
  });

  return installedDtoSchema.parse(response).data;
});
