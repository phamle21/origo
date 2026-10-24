import { describe, expect, test } from 'vitest';
import { projectCodeSchema, screenCodeSchema } from '~~/server/utils/route-params';

describe('route parameter schemas', () => {
  test('normalize valid codes to upper case', () => {
    expect(projectCodeSchema.parse('lms')).toBe('LMS');
    expect(screenCodeSchema.parse('sc-01')).toBe('SC-01');
    expect(screenCodeSchema.parse('SC-100')).toBe('SC-100');
  });

  test('accept project codes from 2 to 16 characters and reject the bounds outside', () => {
    expect(projectCodeSchema.safeParse('AB').success).toBe(true);
    expect(projectCodeSchema.safeParse('A'.repeat(16)).success).toBe(true);
    expect(projectCodeSchema.safeParse('A').success).toBe(false);
    expect(projectCodeSchema.safeParse('A'.repeat(17)).success).toBe(false);
  });

  test('reject malformed input', () => {
    expect(projectCodeSchema.safeParse('1AB').success).toBe(false);
    expect(projectCodeSchema.safeParse('AB C').success).toBe(false);
    expect(screenCodeSchema.safeParse('SC-1').success).toBe(false);
    expect(screenCodeSchema.safeParse('SC-0001').success).toBe(false);
    expect(screenCodeSchema.safeParse('../SC-01').success).toBe(false);
  });
});
