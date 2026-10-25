<?php

namespace Origo\Core\Plan\Actions;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;
use Origo\Core\Plan\Enums\PlanItemKind;
use Origo\Core\Plan\Enums\PlanTaskStatus;
use Origo\Core\Plan\Models\PlanItem;
use Origo\Core\Plan\Models\PlanStage;
use Origo\Core\Plan\Models\PlanStatus;
use Origo\Core\Plan\Models\PlanTask;
use Origo\Core\Plan\Support\PlanStatuses;

/**
 * Creates or updates the task of one feature in one stage, as a Gantt bar is drawn, moved or resized or the
 * task form is saved. Fields left out keep their value, so dragging a bar does not wipe its estimate.
 */
class SavePlanTask
{
    public function __construct(private readonly PlanStatuses $statuses) {}

    /**
     * @param  array{startDate: string, endDate: string, status?: string|null, statusId?: string|null, assigneeId?: int|null, estimateDays?: float|null, progress?: int|null, link?: string|null, note?: string|null}  $data
     */
    public function handle(PlanItem $feature, PlanStage $stage, array $data): PlanTask
    {
        if ($feature->kind !== PlanItemKind::Feature) {
            throw ValidationException::withMessages(['itemId' => 'Only features have tasks; modules and phases are summed up from them.']);
        }

        $project = $feature->project()->firstOrFail();

        if ($data['assigneeId'] ?? null) {
            if (! $project->members()->where('user_id', $data['assigneeId'])->exists()) {
                throw ValidationException::withMessages(['assigneeId' => 'The assignee must be a member of the project.']);
            }
        }

        $task = PlanTask::query()->firstOrNew(['plan_item_id' => $feature->id, 'plan_stage_id' => $stage->id]);
        $task->fill(['start_date' => $data['startDate'], 'end_date' => $data['endDate']]);
        $this->applyStatus($task, $this->statuses->forProject($project), $data);

        foreach (['assigneeId' => 'assignee_id', 'estimateDays' => 'estimate_days', 'progress' => 'progress'] as $field => $column) {
            if (array_key_exists($field, $data)) {
                $task->{$column} = $data[$field];
            }
        }

        foreach (['link', 'note'] as $field) {
            if (array_key_exists($field, $data)) {
                $task->{$field} = trim((string) $data[$field]) ?: null;
            }
        }

        $task->save();

        return $task;
    }

    /**
     * A named status sets the category too. A category alone (the chart's quick menu) keeps the task's own
     * status when it already belongs there, otherwise picks the first status of that category.
     *
     * @param  Collection<int, PlanStatus>  $statuses
     * @param  array<string, mixed>  $data
     */
    private function applyStatus(PlanTask $task, $statuses, array $data): void
    {
        if (! empty($data['statusId'])) {
            $status = $statuses->firstWhere('id', $data['statusId'])
                ?? throw ValidationException::withMessages(['statusId' => 'Choose one of the project\'s statuses.']);
            $task->fill(['status' => $status->category, 'plan_status_id' => $status->id]);

            return;
        }

        $category = isset($data['status']) ? PlanTaskStatus::from($data['status']) : ($task->status ?? PlanTaskStatus::Todo);
        $current = $statuses->firstWhere('id', $task->plan_status_id);

        $task->fill([
            'status' => $category,
            'plan_status_id' => $current?->category === $category ? $current->id : $statuses->first(fn (PlanStatus $status) => $status->category === $category)?->id,
        ]);
    }
}
