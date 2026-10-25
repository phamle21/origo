import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { projectParamsSchema } from '~~/server/utils/route-params';

const querySchema = z.object({
  lang: z
    .string()
    .regex(/^[a-z]{2,3}(-[a-z]{2,4})?$/i)
    .default('vi'),
});
// The workbook is built on demand; a large plan takes a few seconds.
const EXPORT_TIMEOUT_MILLISECONDS = 60_000;

/** The plan as an Excel workbook, passed through from the API as a download. */
export default defineApiHandler(async (event): Promise<Buffer> => {
  const { code } = await getValidatedRouterParams(event, (value) => projectParamsSchema.parse(value));
  const { lang } = await getValidatedQuery(event, (value) => querySchema.parse(value));
  const file = (await createOrigoApiClient(event)(`/projects/${code}/plan/export`, {
    query: { lang },
    responseType: 'arrayBuffer',
    timeout: EXPORT_TIMEOUT_MILLISECONDS,
  })) as ArrayBuffer;
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');

  setResponseHeaders(event, {
    'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'content-disposition': `attachment; filename="${code}_Project_Management_${date}.xlsx"`,
    'cache-control': 'no-store',
  });

  return Buffer.from(file);
});
