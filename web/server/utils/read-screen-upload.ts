import type { H3Event } from 'h3';
import { createAppError } from '~~/server/exceptions/app-error';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';
import { SCREEN_EDITOR_LIMITS, SCREEN_RENDER_WIDTHS } from '~~/shared/contracts/screen-editor';
import type { LocalizedText } from '~~/shared/contracts/content';

// Room for the text fields that travel with the file in the same multipart body.
const FORM_OVERHEAD_BYTES = 64 * 1_024;

export interface UploadedPart {
  data: Buffer;
  type: string;
  filename: string;
}

/** Exactly one source; checked again by the API, which owns the rules. */
export type ScreenUploadSource =
  | { kind: 'image'; file: UploadedPart }
  | { kind: 'html'; file: UploadedPart; width: number }
  | { kind: 'url'; url: string; width: number };

export interface ScreenUpload {
  fields: Record<string, string>;
  source: ScreenUploadSource | null;
}

function invalid(field: string): never {
  throw createAppError(API_ERROR_CODES.validationFailed, { fields: { [field]: ['invalid'] } });
}

function readWidth(value: string | undefined): number {
  const width = Number(value ?? SCREEN_RENDER_WIDTHS[0]);

  return (SCREEN_RENDER_WIDTHS as readonly number[]).includes(width) ? width : invalid('width');
}

function hasHtmlExtension(filename: string): boolean {
  return SCREEN_EDITOR_LIMITS.htmlExtensions.some((extension) => filename.toLowerCase().endsWith(extension));
}

/**
 * Reads a multipart screen form with one source: `image`, `html` (.html/.htm/.zip) or `url` + `width`.
 * The declared length is checked before buffering so an oversized upload is refused without being read.
 */
export async function readScreenUpload(event: H3Event): Promise<ScreenUpload> {
  const declaredLength = Number(getRequestHeader(event, 'content-length'));

  if (!Number.isFinite(declaredLength) || declaredLength <= 0 || declaredLength > SCREEN_EDITOR_LIMITS.maxImageBytes + FORM_OVERHEAD_BYTES) {
    throw createAppError(API_ERROR_CODES.payloadTooLarge, { internalMessage: `screen upload declared ${declaredLength} bytes` });
  }

  const fields: Record<string, string> = {};
  const files: Record<string, UploadedPart> = {};

  for (const part of (await readMultipartFormData(event)) ?? []) {
    if (!part.name) {
      continue;
    }

    if (part.filename) {
      files[part.name] = { data: part.data, type: part.type ?? 'application/octet-stream', filename: part.filename };
    } else {
      fields[part.name] = part.data.toString('utf8');
    }
  }

  const url = fields.url?.trim();
  const kinds = [files.image, files.html, url].filter(Boolean).length;

  if (kinds > 1) {
    invalid('source');
  }

  if (files.image) {
    return (SCREEN_EDITOR_LIMITS.imageTypes as readonly string[]).includes(files.image.type)
      ? { fields, source: { kind: 'image', file: files.image } }
      : invalid('image');
  }

  if (files.html) {
    return hasHtmlExtension(files.html.filename) ? { fields, source: { kind: 'html', file: files.html, width: readWidth(fields.width) } } : invalid('html');
  }

  if (url) {
    return /^https?:\/\//i.test(url) && url.length <= SCREEN_EDITOR_LIMITS.maxUrlLength
      ? { fields, source: { kind: 'url', url, width: readWidth(fields.width) } }
      : invalid('url');
  }

  return { fields, source: null };
}

/** Rebuilds the form for the API, which expects bracketed names such as `name[vi]`. */
export function toApiFormData(texts: Record<string, LocalizedText>, source: ScreenUploadSource | null): FormData {
  const form = new FormData();

  for (const [field, value] of Object.entries(texts)) {
    for (const [locale, text] of Object.entries(value)) {
      form.append(`${field}[${locale}]`, text ?? '');
    }
  }

  if (source?.kind === 'url') {
    form.append('url', source.url);
  } else if (source) {
    form.append(source.kind, new Blob([new Uint8Array(source.file.data)], { type: source.file.type }), source.file.filename);
  }

  if (source && source.kind !== 'image') {
    form.append('width', String(source.width));
  }

  return form;
}
