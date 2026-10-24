import { z } from 'zod';

// Route parameters are user input: each code is checked against its documented shape and normalized to
// upper case before any service sees it, so `/p/lms` and `/p/LMS` resolve to the same project.
const upperCode = (pattern: RegExp) =>
  z
    .string()
    .regex(pattern)
    .transform((value) => value.toUpperCase());

export const projectCodeSchema = upperCode(/^[a-z][a-z0-9]{1,15}$/i);
export const screenCodeSchema = upperCode(/^sc-\d{2,3}$/i);
// Laravel ULIDs, lower or upper case.
export const ulidSchema = z.string().regex(/^[0-9a-hjkmnp-tv-z]{26}$/i);
export const pointIdSchema = ulidSchema;
export const userIdSchema = z.coerce.number().int().positive();

export const projectParamsSchema = z.object({ code: projectCodeSchema });
