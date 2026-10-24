<?php

namespace Origo\Core\Plan\Actions;

use Illuminate\Validation\ValidationException;
use Origo\Core\Plan\Enums\PlanItemKind;
use Origo\Core\Plan\Enums\PlanTaskStatus;
use Origo\Core\Plan\Models\PlanItem;
use Origo\Core\Plan\Models\PlanStage;
use Origo\Core\Plan\Models\PlanTask;

/** Creates or updates the task of one feature in one stage, as a Gantt bar is drawn, moved or resized. */
class SavePlanTask
{
    /**
     * @param  array{startDate: string, endDate: string, status?: string, assigneeId?: int|null}  $data
     */
    public function handle(PlanItem $feature, PlanStage $stage, array $data): PlanTask
    {
        if ($feature->kind !== PlanItemKind::Feature) {
            throw ValidationException::withMessages(['itemId' => 'Only features have tasks; modules and phases are summed up from them.']);
        }

        if ($data['assigneeId'] ?? null) {
            $isMember = $feature->project()->firstOrFail()->members()->where('user_id', $data['assigneeId'])->exists();

            if (! $isMember) {
                throw ValidationException::withMessages(['assigneeId' => 'The assignee must be a member of the project.']);
            }
        }

        return PlanTask::query()->updateOrCreate(
            ['plan_item_id' => $feature->id, 'plan_stage_id' => $stage->id],
            [
                'start_date' => $data['startDate'],
                'end_date' => $data['endDate'],
                'status' => PlanTaskStatus::from($data['status'] ?? PlanTaskStatus::Todo->value),
                'assignee_id' => $data['assigneeId'] ?? null,
            ],
        );
    }
}
