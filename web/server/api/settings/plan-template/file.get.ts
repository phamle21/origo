import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';

/** The emptied template as stored, for an admin to check what exports are filled into. */
export default defineApiHandler(async (event): Promise<Buffer> => {
  const file = (await createOrigoApiClient(event)('/admin/settings/plan-template/file', { responseType: 'arrayBuffer' })) as ArrayBuffer;

  setResponseHeaders(event, {
    'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'content-disposition': 'attachment; filename="Project_Management_template.xlsx"',
    'cache-control': 'no-store',
  });

  return Buffer.from(file);
});
