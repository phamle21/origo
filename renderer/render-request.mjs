import path from 'node:path';

export const WIDTHS = [390, 1024, 1440];
export const MAX_FILES = 300;
export const MAX_URL_LENGTH = 2_048;

export class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** A relative path inside the upload, or null when it could escape the upload folder. */
export function toSafeRelativePath(rawPath) {
  if (typeof rawPath !== 'string' || rawPath === '' || rawPath.includes('\0') || rawPath.includes('\\')) {
    return null;
  }

  const normalized = path.posix.normalize(rawPath);

  if (path.posix.isAbsolute(normalized) || normalized === '..' || normalized.startsWith('../') || normalized === '.') {
    return null;
  }

  return normalized;
}

/** Validates the JSON body sent by the API and returns a normalized render job. */
export function parseRenderRequest(body) {
  if (typeof body !== 'object' || body === null) {
    throw new RequestError(400, 'body must be an object');
  }

  const width = Number(body.width);

  if (!WIDTHS.includes(width)) {
    throw new RequestError(400, `width must be one of ${WIDTHS.join(', ')}`);
  }

  if (body.kind === 'url') {
    if (typeof body.url !== 'string' || body.url.length > MAX_URL_LENGTH || !/^https?:\/\//i.test(body.url)) {
      throw new RequestError(400, 'url must be an http(s) URL');
    }

    return { kind: 'url', url: body.url, width };
  }

  if (body.kind === 'html') {
    const entries = Object.entries(body.files ?? {});

    if (entries.length === 0 || entries.length > MAX_FILES) {
      throw new RequestError(400, `files must hold 1 to ${MAX_FILES} entries`);
    }

    const files = entries.map(([rawPath, content]) => {
      const relativePath = toSafeRelativePath(rawPath);

      if (!relativePath || typeof content !== 'string') {
        throw new RequestError(400, `invalid file entry: ${String(rawPath).slice(0, 100)}`);
      }

      return { relativePath, content: Buffer.from(content, 'base64') };
    });

    const entry = toSafeRelativePath(body.entry);

    if (!entry || !files.some((file) => file.relativePath === entry)) {
      throw new RequestError(400, 'entry must name one of the files');
    }

    return { kind: 'html', entry, files, width };
  }

  throw new RequestError(400, 'kind must be "html" or "url"');
}
