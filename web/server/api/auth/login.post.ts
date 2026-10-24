import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { loginDtoSchema } from '~~/server/integrations/origo-api/dto/screen-map.dto';
import { writeSessionToken } from '~~/server/utils/session';
import type { CurrentUser } from '~~/shared/contracts/auth';

const MAX_BODY_BYTES = 2_048;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1).max(255),
});

export default defineApiHandler(async (event): Promise<CurrentUser> => {
  const body = await readValidatedJsonBody(event, loginSchema, MAX_BODY_BYTES);
  const response = loginDtoSchema.parse(await createOrigoApiClient(event)('/auth/login', { method: 'POST', body }));

  writeSessionToken(event, response.token);

  return response.user;
});
