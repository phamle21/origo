import { afterEach, describe, expect, test, vi } from 'vitest';
import { createOrigoApiTransport, toFieldReason } from '~~/server/integrations/origo-api/client';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';

const transport = vi.fn();
const createTransport = vi.fn(() => transport);
const settings = { baseUrl: 'http://origo-api', timeoutMilliseconds: 1_000, token: 'token-1' };

afterEach(() => {
  vi.clearAllMocks();
});

describe('createOrigoApiTransport', () => {
  test('targets API v1 and forwards the session token as a bearer token', async () => {
    transport.mockResolvedValue({ data: [] });

    await expect(createOrigoApiTransport(settings, createTransport)('/projects')).resolves.toEqual({ data: [] });
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'http://origo-api/api/v1', timeout: 1_000, headers: expect.objectContaining({ Authorization: 'Bearer token-1' }) }),
    );
  });

  test('sends no authorization header without a session', async () => {
    transport.mockResolvedValue({});

    await createOrigoApiTransport({ ...settings, token: null }, createTransport)('/auth/login', { method: 'POST' });

    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ headers: { Accept: 'application/json' } }));
  });

  test('maps a validation failure to field issues without the API wording', async () => {
    transport.mockRejectedValue({ statusCode: 422, data: { errors: { 'name.vi': ['The name.vi field is required.'] } } });

    await expect(createOrigoApiTransport(settings, createTransport)('/projects/LMS/screens')).rejects.toMatchObject({
      code: API_ERROR_CODES.validationFailed,
      fields: { 'name.vi': ['required'] },
    });
  });

  test.each([
    ['The email has already been taken.', 'taken'],
    ['The password is incorrect.', 'incorrect'],
    ['The password field must be at least 10 characters.', 'tooShort'],
    ['Something the web does not know about.', 'invalid'],
  ])('turns "%s" into the safe reason %s', (message, reason) => {
    expect(toFieldReason([message])).toBe(reason);
  });

  test.each([
    [401, API_ERROR_CODES.unauthenticated],
    [403, API_ERROR_CODES.forbidden],
    [404, API_ERROR_CODES.notFound],
    [429, API_ERROR_CODES.rateLimited],
  ])('maps status %i to %s', async (status, code) => {
    transport.mockRejectedValue({ status });

    await expect(createOrigoApiTransport(settings, createTransport)('/projects/LMS/map')).rejects.toMatchObject({ code });
  });

  test('leaves a server failure to the shared normalizer as an upstream error', async () => {
    const failure = { statusCode: 500, name: 'FetchError' };
    transport.mockRejectedValue(failure);

    await expect(createOrigoApiTransport(settings, createTransport)('/projects')).rejects.toBe(failure);
  });
});
