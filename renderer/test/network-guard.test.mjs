import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createNetworkGuard, isPrivateAddress } from '../network-guard.mjs';

test('recognizes private, loopback, link-local and mapped addresses', () => {
  for (const address of ['10.1.2.3', '127.0.0.1', '169.254.169.254', '172.20.0.5', '192.168.1.1', '::1', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1']) {
    assert.equal(isPrivateAddress(address), true, address);
  }

  for (const address of ['93.184.216.34', '8.8.8.8', '172.32.0.1', '2606:4700::1111']) {
    assert.equal(isPrivateAddress(address), false, address);
  }
});

test('allows public http(s), data and blob URLs and blocks everything else', async () => {
  const guard = createNetworkGuard({ lookup: async (host) => [{ address: host === 'internal.example' ? '10.0.0.5' : '93.184.216.34' }] });

  assert.equal(await guard.isAllowedUrl('https://example.com/a.css'), true);
  assert.equal(await guard.isAllowedUrl('data:image/png;base64,AAAA'), true);
  assert.equal(await guard.isAllowedUrl('https://internal.example/'), false);
  assert.equal(await guard.isAllowedUrl('http://127.0.0.1:5432'), false);
  assert.equal(await guard.isAllowedUrl('http://[::1]/'), false);
  assert.equal(await guard.isAllowedUrl('file:///etc/passwd'), false);
  assert.equal(await guard.isAllowedUrl('ftp://example.com'), false);
  assert.equal(await guard.isAllowedUrl('not a url'), false);
});

test('treats a host that does not resolve as blocked and honours the allow list', async () => {
  const guard = createNetworkGuard({
    allowedPrivateHosts: ['staging.local'],
    lookup: async (host) => {
      if (host === 'missing.example') {
        throw new Error('ENOTFOUND');
      }

      return [{ address: '10.0.0.9' }];
    },
  });

  assert.equal(await guard.isAllowedUrl('https://missing.example/'), false);
  assert.equal(await guard.isAllowedUrl('http://staging.local/'), true);
  assert.equal(await guard.isAllowedUrl('http://other.local/'), false);
});
