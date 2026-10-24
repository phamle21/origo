import { describe, expect, test } from 'vitest';
import { appendScreenSource } from '@/utils/screen-source';

function entries(form: FormData) {
  return [...form.entries()].map(([name, value]) => [name, typeof value === 'string' ? value : (value as File).name]);
}

describe('appendScreenSource', () => {
  test('sends an image without a width', () => {
    const form = appendScreenSource(new FormData(), { kind: 'image', file: new File(['x'], 'cart.png', { type: 'image/png' }) });

    expect(entries(form)).toEqual([['image', 'cart.png']]);
  });

  test('sends an html upload with its capture width', () => {
    const form = appendScreenSource(new FormData(), { kind: 'html', file: new File(['<h1>'], 'mockup.zip'), width: 390 });

    expect(entries(form)).toEqual([
      ['html', 'mockup.zip'],
      ['width', '390'],
    ]);
  });

  test('sends a trimmed URL with its capture width', () => {
    const form = appendScreenSource(new FormData(), { kind: 'url', url: ' https://example.com ', width: 1440 });

    expect(entries(form)).toEqual([
      ['url', 'https://example.com'],
      ['width', '1440'],
    ]);
  });
});
