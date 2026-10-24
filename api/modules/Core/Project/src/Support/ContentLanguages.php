<?php

namespace Origo\Core\Project\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The content languages admins have set up, read once per request (the service is scoped). Vietnamese
 * is the default: always present, always active and always first. A language is never deleted, only
 * switched off, so translations already written are kept and come back when it is switched on again.
 */
class ContentLanguages
{
    public const DEFAULT = 'vi';

    public const CODE_PATTERN = '/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/';

    /** @var list<array{code: string, name: string, isActive: bool, isDefault: bool}>|null */
    private ?array $languages = null;

    /**
     * @return list<array{code: string, name: string, isActive: bool, isDefault: bool}>
     */
    public function all(): array
    {
        return $this->languages ??= DB::table('content_languages')
            ->orderByRaw('code = ? desc', [self::DEFAULT])
            ->orderBy('position')
            ->get()
            ->map(fn (object $row) => [
                'code' => $row->code,
                'name' => $row->name,
                'isActive' => $row->code === self::DEFAULT || (bool) $row->is_active,
                'isDefault' => $row->code === self::DEFAULT,
            ])
            ->values()
            ->all();
    }

    /** @return list<string> every language ever set up, active or not */
    public function codes(): array
    {
        return array_column($this->all(), 'code') ?: [self::DEFAULT];
    }

    /** @return list<string> */
    public function activeCodes(): array
    {
        return array_column(array_filter($this->all(), fn (array $language) => $language['isActive']), 'code') ?: [self::DEFAULT];
    }

    /**
     * Saves the whole ordered list. Languages cannot be removed (only switched off) and the default
     * stays first and active whatever is sent.
     *
     * @param  list<array{code: string, name: string, isActive: bool}>  $languages
     */
    public function save(array $languages): void
    {
        $sentCodes = array_map(fn (array $language) => $language['code'], $languages);
        $missing = array_diff($this->codes(), $sentCodes);

        if ($missing !== []) {
            throw ValidationException::withMessages(['languages' => 'Languages cannot be removed, only switched off: '.implode(', ', $missing)]);
        }

        DB::transaction(function () use ($languages) {
            $position = 1;
            $ordered = [
                ...array_filter($languages, fn (array $language) => $language['code'] === self::DEFAULT),
                ...array_filter($languages, fn (array $language) => $language['code'] !== self::DEFAULT),
            ];

            foreach ($ordered as $language) {
                // created_at is written only when the language is new; updates leave it alone.
                DB::table('content_languages')->upsert([[
                    'code' => $language['code'],
                    'name' => trim($language['name']),
                    'position' => $position++,
                    'is_active' => $language['code'] === self::DEFAULT || $language['isActive'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]], ['code'], ['name', 'position', 'is_active', 'updated_at']);
            }
        });

        $this->languages = null;
    }
}
