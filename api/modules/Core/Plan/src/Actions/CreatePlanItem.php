<?php

namespace Origo\Core\Plan\Actions;

use Illuminate\Validation\ValidationException;
use Origo\Core\Plan\Enums\PlanItemKind;
use Origo\Core\Plan\Models\PlanItem;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Support\LocalizedText;

/** Adds a phase (top level), a module (under a phase) or a feature (under a module) at the end. */
class CreatePlanItem
{
    /**
     * @param  array<string, mixed>  $name
     */
    public function handle(Project $project, PlanItemKind $kind, array $name, ?PlanItem $parent): PlanItem
    {
        if ($parent?->kind !== $kind->parentKind() || ($parent !== null && $parent->project_id !== $project->id)) {
            throw ValidationException::withMessages(['parentId' => 'A phase sits at the top, a module inside a phase and a feature inside a module.']);
        }

        $position = (int) PlanItem::query()->where('project_id', $project->id)->where('parent_id', $parent?->id)->max('position') + 1;

        return PlanItem::create([
            'project_id' => $project->id,
            'parent_id' => $parent?->id,
            'kind' => $kind,
            'name' => LocalizedText::normalize($name),
            'position' => $position,
        ]);
    }
}
