import type { ScreenSourceInput } from '~~/shared/contracts/screen-editor';

/** Adds the one screenshot source to a multipart form, using the names the web server expects. */
export function appendScreenSource(form: FormData, source: ScreenSourceInput): FormData {
  if (source.kind === 'url') {
    form.append('url', source.url.trim());
  } else {
    form.append(source.kind, source.file);
  }

  if (source.kind !== 'image') {
    form.append('width', String(source.width));
  }

  return form;
}
