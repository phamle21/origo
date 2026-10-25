<?php

namespace Origo\Core\Plan\Actions;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Origo\Core\Plan\Models\PlanStage;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Support\LocalizedText;

/**
 * Saves the whole ordered list of stages. Stages missing from the list are deleted together with their
 * tasks, so the editor confirms that before sending.
 */
class SyncPlanStages
{
    /**
     * @param  array<int, array{id?: string|null, name: array<string, mixed>, color: string, startDate?: string|null, endDate?: string|null, owner?: string|null}>  $stages
     */
    public function handle(Project $project, array $stages): void
    {
        DB::transaction(function () use ($project, $stages) {
            $keptIds = array_values(array_filter(array_map(fn (array $stage) => $stage['id'] ?? null, $stages)));
            PlanStage::query()->where('project_id', $project->id)->whereNotIn('id', $keptIds)->delete();

            foreach (array_values($stages) as $index => $data) {
                $stage = isset($data['id'])
                    ? PlanStage::query()->where('project_id', $project->id)->findOrFail($data['id'])
                    : new PlanStage(['project_id' => $project->id, 'key' => $this->uniqueKey($project, $data['name'])]);

                $stage->fill(['name' => LocalizedText::normalize($data['name']), 'color' => strtolower($data['color']), 'position' => $index + 1]);

                // The stage window and its owner are optional; a list sent without them keeps them.
                foreach (['startDate' => 'start_date', 'endDate' => 'end_date', 'owner' => 'owner'] as $field => $column) {
                    if (array_key_exists($field, $data)) {
                        $stage->{$column} = $data[$field] === '' ? null : $data[$field];
                    }
                }

                $stage->save();
            }
        });
    }

    /**
     * @param  array<string, mixed>  $name
     */
    private function uniqueKey(Project $project, array $name): string
    {
        $base = Str::slug((LocalizedText::primary($name) ?: 'stage')) ?: 'stage';
        $key = $base;
        $suffix = 2;

        while (PlanStage::query()->where('project_id', $project->id)->where('key', $key)->exists()) {
            $key = "{$base}-".$suffix++;
        }

        return $key;
    }
}
