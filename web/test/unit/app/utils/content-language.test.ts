import { describe, expect, test } from 'vitest';
import { localizedValues, resolveLocalizedText } from '@/utils/content-language';

describe('resolveLocalizedText', () => {
  test('returns the wanted language when it is written', () => {
    expect(resolveLocalizedText({ vi: 'Giá', ja: '価格' }, 'ja')).toEqual({ value: '価格', locale: 'ja', isFallback: false });
  });

  test('falls back to the other language when the wanted one is missing or blank', () => {
    expect(resolveLocalizedText({ vi: 'Giá', ja: null }, 'ja')).toEqual({ value: 'Giá', locale: 'vi', isFallback: true });
    expect(resolveLocalizedText({ vi: 'Giá', ja: '   ' }, 'ja')).toEqual({ value: 'Giá', locale: 'vi', isFallback: true });
  });

  test('returns an empty value rather than "null" when neither language is written', () => {
    expect(resolveLocalizedText({ vi: null, ja: null }, 'vi').value).toBe('');
  });

  test('falls back to Vietnamese first, then to any written language', () => {
    expect(resolveLocalizedText({ vi: 'Giá', ja: '価格', en: null }, 'en')).toEqual({ value: 'Giá', locale: 'vi', isFallback: true });
    expect(resolveLocalizedText({ vi: null, ja: null, en: 'Price' }, 'ja')).toEqual({ value: 'Price', locale: 'en', isFallback: true });
  });

  test('lists every written translation for searching', () => {
    expect(localizedValues({ vi: 'Giá', ja: ' ', en: 'Price' })).toEqual(['Giá', 'Price']);
  });
});
