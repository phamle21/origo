<?php

namespace Origo\Core\Screen\Actions;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Origo\Core\Project\Support\LocalizedText;
use Origo\Core\Screen\Models\Concept;
use Origo\Core\Screen\Models\Screen;
use Origo\Core\Screen\Models\ScreenPoint;

/**
 * Saves the whole set of points of one screen at once, the way the editor works: the array order is
 * the numbering, points missing from the array are deleted (with their comments), points with an id
 * are updated and the others are created. Everything happens in one transaction.
 */
class SyncScreenPoints
{
    /**
     * @param  array<int, array<string, mixed>>  $points  already validated
     * @return Collection<int, ScreenPoint>
     */
    public function handle(Screen $screen, array $points): Collection
    {
        return DB::transaction(function () use ($screen, $points) {
            $keptIds = array_values(array_filter(array_map(fn (array $point) => $point['id'] ?? null, $points)));

            $screen->points()->whereNotIn('id', $keptIds)->delete();

            $conceptIds = Concept::query()->where('project_id', $screen->project_id)->pluck('id', 'key');
            $existingPointIds = ScreenPoint::query()->whereHas('screen', fn ($query) => $query->where('project_id', $screen->project_id))->pluck('id')->flip();

            foreach (array_values($points) as $index => $data) {
                $point = isset($data['id']) ? $screen->points()->findOrFail($data['id']) : new ScreenPoint(['screen_id' => $screen->id]);

                $point->fill([
                    'number' => $index + 1,
                    'box' => array_map(fn ($value) => round((float) $value, 2), $data['box']),
                    'title' => LocalizedText::normalize($data['title']),
                    'basic' => [
                        'summary' => LocalizedText::normalize($data['basic']['summary'] ?? null),
                        'rules' => array_map(LocalizedText::normalize(...), $data['basic']['rules'] ?? []),
                    ],
                    'detail' => [
                        'rows' => array_map(fn (array $row) => [
                            'item' => LocalizedText::normalize($row['item'] ?? null),
                            'spec' => LocalizedText::normalize($row['spec'] ?? null),
                        ], $data['detail']['rows'] ?? []),
                        'endpoints' => array_values(array_filter(array_map('trim', $data['detail']['endpoints'] ?? []))),
                    ],
                    'tests' => array_map(fn (array $test) => [
                        'given' => LocalizedText::normalize($test['given'] ?? null),
                        'when' => LocalizedText::normalize($test['when'] ?? null),
                        'then' => LocalizedText::normalize($test['then'] ?? null),
                    ], $data['tests'] ?? []),
                    'history' => array_map(fn (array $entry) => [
                        'phase' => trim((string) $entry['phase']),
                        'note' => LocalizedText::normalize($entry['note'] ?? null),
                    ], $data['history'] ?? []),
                ])->save();

                $point->concepts()->sync(collect($data['concepts'] ?? [])->map(fn (string $key) => $conceptIds[$key] ?? null)->filter()->values());

                // A dependency on a point deleted in this same save is dropped instead of failing the save.
                $point->dependencies()->sync(collect($data['dependsOn'] ?? [])
                    ->filter(fn (string $id) => $id !== $point->id && $existingPointIds->has($id))
                    ->unique()
                    ->values());
            }

            return $screen->points()->get();
        });
    }
}
