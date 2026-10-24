<?php

namespace Origo\Core\Plan\Actions;

use Origo\Core\Plan\Models\PlanStage;
use Origo\Core\Project\Models\Project;

/** Gives a project the default stages (see DefaultStageTemplate) the first time its plan is opened; it can change them later. */
class EnsureDefaultStages
{
    public function __construct(private readonly DefaultStageTemplate $template) {}

    public function handle(Project $project): void
    {
        if (PlanStage::query()->where('project_id', $project->id)->exists()) {
            return;
        }

        foreach ($this->template->stages() as $position => $stage) {
            PlanStage::create([
                'project_id' => $project->id,
                'key' => $stage['key'],
                'name' => $stage['name'],
                'color' => $stage['color'],
                'position' => $position + 1,
            ]);
        }
    }
}
