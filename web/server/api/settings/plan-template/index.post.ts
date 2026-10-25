import { createAppError } from '~~/server/exceptions/app-error';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { planTemplateDtoSchema } from '~~/server/integrations/origo-api/dto/plan.dto';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';
import type { PlanExcelTemplate } from '~~/shared/contracts/plan';

const MAX_FILE_BYTES = 20 * 1_024 * 1_024;
const FORM_OVERHEAD_BYTES = 16 * 1_024;
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
// Emptying a large workbook of its old data takes a while.
const UPLOAD_TIMEOUT_MILLISECONDS = 120_000;

/** Passes an uploaded .xlsx (and the chosen Gantt sheet, if any) on to the API, which empties and keeps it. */
export default defineApiHandler(async (event): Promise<PlanExcelTemplate | null> => {
  const declaredLength = Number(getRequestHeader(event, 'content-length'));

  if (!Number.isFinite(declaredLength) || declaredLength <= 0 || declaredLength > MAX_FILE_BYTES + FORM_OVERHEAD_BYTES) {
    throw createAppError(API_ERROR_CODES.payloadTooLarge, { internalMessage: `template upload declared ${declaredLength} bytes` });
  }

  const parts = (await readMultipartFormData(event)) ?? [];
  const file = parts.find((part) => part.name === 'file' && part.filename);
  const sheet = parts
    .find((part) => part.name === 'sheet' && !part.filename)
    ?.data.toString('utf8')
    .trim()
    .slice(0, 100);

  if (!file?.filename || !file.filename.toLowerCase().endsWith('.xlsx')) {
    throw createAppError(API_ERROR_CODES.validationFailed, { fields: { file: ['invalid'] } });
  }

  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(file.data)], { type: XLSX_TYPE }), file.filename.slice(0, 200));
  if (sheet) {
    form.append('sheet', sheet);
  }

  const response = await createOrigoApiClient(event)('/admin/settings/plan-template', { method: 'POST', body: form, timeout: UPLOAD_TIMEOUT_MILLISECONDS });

  return planTemplateDtoSchema.parse(response).data;
});
