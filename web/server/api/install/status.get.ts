import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { installStatusDtoSchema } from '~~/server/integrations/origo-api/dto/install.dto';
import type { InstallStatus } from '~~/shared/contracts/install';

export default defineApiHandler(async (event): Promise<InstallStatus> => installStatusDtoSchema.parse(await createOrigoApiClient(event)('/install')).data);
