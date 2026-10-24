<?php

namespace Origo\Core\Plan\Actions;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Origo\Core\Plan\Models\PlanStageTemplate;
use Origo\Core\Project\Support\LocalizedText;

/**
 * The stages a new project's plan starts with. Until an admin saves their own list, the built-in
 * delivery stages are used. Changing the list never touches projects that already have stages.
 */
class DefaultStageTemplate
{
    /** @var list<array{key: string, vi: string, ja: string, color: string}> */
    public const BUILT_IN = [
        ['key' => 'basic-design', 'vi' => 'Thiết kế cơ bản', 'ja' => '基本設計', 'color' => '#7c3aed'],
        ['key' => 'detail-design', 'vi' => 'Thiết kế chi tiết', 'ja' => '詳細設計', 'color' => '#2563eb'],
        ['key' => 'development', 'vi' => 'Phát triển', 'ja' => '開発', 'color' => '#0f766e'],
        ['key' => 'deploy-dev', 'vi' => 'Deploy DEV', 'ja' => 'DEV環境リリース', 'color' => '#ca8a04'],
        ['key' => 'uat', 'vi' => 'UAT', 'ja' => '受入テスト', 'color' => '#ea580c'],
        ['key' => 'production', 'vi' => 'PROD', 'ja' => '本番リリース', 'color' => '#be123c'],
    ];

    /**
     * @return list<array{key: string, name: array{vi: string|null, ja: string|null}, color: string}>
     */
    public function stages(): array
    {
        $saved = PlanStageTemplate::query()->orderBy('position')->get();

        if ($saved->isEmpty()) {
            return array_map(fn (array $stage) => [
                'key' => $stage['key'],
                'name' => ['vi' => $stage['vi'], 'ja' => $stage['ja']],
                'color' => $stage['color'],
            ], self::BUILT_IN);
        }

        return $saved->map(fn (PlanStageTemplate $stage) => [
            'key' => $stage->key,
            'name' => LocalizedText::normalize($stage->name),
            'color' => $stage->color,
        ])->all();
    }

    /**
     * Replaces the whole ordered list.
     *
     * @param  array<int, array{name: array<string, mixed>, color: string}>  $stages
     */
    public function save(array $stages): void
    {
        DB::transaction(function () use ($stages) {
            PlanStageTemplate::query()->delete();
            $usedKeys = [];

            foreach (array_values($stages) as $index => $stage) {
                $name = LocalizedText::normalize($stage['name']);
                $base = Str::slug(LocalizedText::primary($name)) ?: 'stage';
                $key = $base;

                for ($suffix = 2; in_array($key, $usedKeys, true); $suffix++) {
                    $key = "{$base}-{$suffix}";
                }

                $usedKeys[] = $key;
                PlanStageTemplate::create(['key' => $key, 'name' => $name, 'color' => strtolower($stage['color']), 'position' => $index + 1]);
            }
        });
    }
}
