<?php

namespace Origo\Core\Project\Support;

/**
 * Specification text stored as one JSON object keyed by content language, e.g. {"vi": ..., "ja": ...}.
 * Vietnamese (the default) is the language the team writes first, so it can be required; every other
 * language may stay empty until translated. The languages come from ContentLanguages, so admins can
 * add more without code changes.
 */
final class LocalizedText
{
    /**
     * Validation rules for one localized field. Keys of switched-off languages are still accepted, so
     * a form sending back an existing translation never loses it.
     *
     * @return array<string, array<int, string>>
     */
    public static function rules(string $field, bool $required = true, int $max = 2000): array
    {
        $codes = app(ContentLanguages::class)->codes();
        $rules = [$field => [$required ? 'required' : 'nullable', 'array:'.implode(',', $codes)]];

        foreach ($codes as $code) {
            $isRequired = $required && $code === ContentLanguages::DEFAULT;
            $rules["{$field}.{$code}"] = [$isRequired ? 'required' : 'nullable', 'string', "max:{$max}"];
        }

        return $rules;
    }

    /**
     * Turns blank strings into null. Every active language is present in the result; a switched-off
     * language is kept only when it holds a translation, so nothing written is ever dropped.
     *
     * @param  array<string, mixed>|null  $value
     * @return array<string, string|null>
     */
    public static function normalize(?array $value): array
    {
        $languages = app(ContentLanguages::class);
        $active = $languages->activeCodes();
        $normalized = [];

        foreach ($languages->codes() as $code) {
            $text = isset($value[$code]) && is_string($value[$code]) ? trim($value[$code]) : '';

            if ($text !== '' || in_array($code, $active, true)) {
                $normalized[$code] = $text === '' ? null : $text;
            }
        }

        return $normalized;
    }

    /**
     * The best text for slugs and fallbacks: the default language, else the first written one.
     *
     * @param  array<string, mixed>|null  $value
     */
    public static function primary(?array $value): string
    {
        $normalized = self::normalize($value);

        return (string) ($normalized[ContentLanguages::DEFAULT] ?? collect($normalized)->filter()->first() ?? '');
    }
}
