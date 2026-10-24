import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseRenderRequest, toSafeRelativePath } from '../render-request.mjs';

const html = Buffer.from('<h1>Hi</h1>').toString('base64');

test('keeps relative paths and rejects any path that could leave the upload', () => {
  assert.equal(toSafeRelativePath('index.html'), 'index.html');
  assert.equal(toSafeRelativePath('assets/./a.css'), 'assets/a.css');

  for (const unsafe of ['../secret', '/etc/passwd', 'a/../../b', '..', '.', '', 'a\\b', 'a\0b', 42]) {
    assert.equal(toSafeRelativePath(unsafe), null, String(unsafe));
  }
});

test('accepts an html job whose entry is one of its files', () => {
  const job = parseRenderRequest({ kind: 'html', width: 1440, entry: 'index.html', files: { 'index.html': html } });

  assert.equal(job.entry, 'index.html');
  assert.equal(job.files[0].content.toString(), '<h1>Hi</h1>');
});

test('rejects unknown widths, missing entries, unsafe paths and non-http URLs', () => {
  assert.throws(() => parseRenderRequest({ kind: 'url', url: 'https://example.com', width: 800 }), /width/);
  assert.throws(() => parseRenderRequest({ kind: 'html', width: 390, entry: 'missing.html', files: { 'index.html': html } }), /entry/);
  assert.throws(() => parseRenderRequest({ kind: 'html', width: 390, entry: 'index.html', files: { '../index.html': html } }), /invalid file/);
  assert.throws(() => parseRenderRequest({ kind: 'url', url: 'file:///etc/passwd', width: 390 }), /http/);
  assert.throws(() => parseRenderRequest({ kind: 'other', width: 390 }), /kind/);
});

test('accepts a public URL job', () => {
  assert.deepEqual(parseRenderRequest({ kind: 'url', url: 'https://example.com', width: 390 }), { kind: 'url', url: 'https://example.com', width: 390 });
});
