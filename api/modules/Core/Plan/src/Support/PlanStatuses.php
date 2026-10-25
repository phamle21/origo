<?php

namespace Origo\Core\Plan\Support;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Origo\Core\Plan\Enums\PlanTaskStatus;
use Origo\Core\Plan\Models\PlanStatus;
use Origo\Core\Plan\Models\PlanTask;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Support\LocalizedText;

/**
 * The statuses a project names itself. A project starts with one per category (To do, In progress, Done);
 * it can add more such as "Checking" or "Pending" and must keep at least one status in each category.
 */
class PlanStatuses
{
    /** @var list<array{category: PlanTaskStatus, name: array{vi: string, ja: string, en: string}, color: string}> */
    public const DEFAULTS = [
        ['category' => PlanTaskStatus::Todo, 'name' => ['vi' => 'Chưa làm', 'ja' => '未着手', 'en' => 'To do'], 'color' => '#94a3b8'],
        ['category' => PlanTaskStatus::Doing, 'name' => ['vi' => 'Đang làm', 'ja' => '対応中', 'en' => 'In progress'], 'color' => '#2563eb'],
        ['category' => PlanTaskStatus::Done, 'name' => ['vi' => 'Xong', 'ja' => '完了', 'en' => 'Done'], 'color' => '#16a34a'],
    ];

    /** @return Collection<int, PlanStatus> */
    public function forProject(Project $project): Collection
    {
        $statuses = PlanStatus::query()->where('project_id', $project->id)->orderBy('position')->get();

        if ($statuses->isNotEmpty()) {
            return $statuses;
        }

        foreach (self::DEFAULTS as $position => $status) {
            PlanStatus::create(['project_id' => $project->id, ...$status, 'position' => $position + 1]);
        }

        return PlanStatus::query()->where('project_id', $project->id)->orderBy('position')->get();
    }

    /**
     * The status a task shows: its own, or the first one of its category when it has none (tasks saved
     * before statuses existed, or whose status was deleted).
     *
     * @param  Collection<int, PlanStatus>  $statuses
     */
    public function resolve(PlanTask $task, Collection $statuses): ?PlanStatus
    {
        return $statuses->firstWhere('id', $task->plan_status_id)
            ?? $statuses->first(fn (PlanStatus $status) => $status->category === $task->status);
    }

    /**
     * Saves the whole ordered list. A deleted status leaves its tasks in the same category.
     *
     * @param  array<int, array{id?: string|null, name: array<string, mixed>, category: string, color: string}>  $statuses
     */
    public function sync(Project $project, array $statuses): void
    {
        $missing = array_diff(array_map(fn (PlanTaskStatus $category) => $category->value, PlanTaskStatus::cases()), array_column($statuses, 'category'));

        if ($missing) {
            throw ValidationException::withMessages(['statuses' => 'Keep at least one status in each category (to do, in progress, done).']);
        }

        DB::transaction(function () use ($project, $statuses) {
            $keptIds = array_values(array_filter(array_map(fn (array $status) => $status['id'] ?? null, $statuses)));
            PlanStatus::query()->where('project_id', $project->id)->whereNotIn('id', $keptIds)->delete();

            foreach (array_values($statuses) as $index => $data) {
                $status = isset($data['id'])
                    ? PlanStatus::query()->where('project_id', $project->id)->findOrFail($data['id'])
                    : new PlanStatus(['project_id' => $project->id]);
                $categoryChanged = $status->exists && $status->category->value !== $data['category'];

                $status->fill([
                    'name' => LocalizedText::normalize($data['name']),
                    'category' => $data['category'],
                    'color' => strtolower($data['color']),
                    'position' => $index + 1,
                ])->save();

                // Tasks follow a status moved to another category, so the chart and progress stay right.
                if ($categoryChanged) {
                    PlanTask::query()->where('plan_status_id', $status->id)->update(['status' => $data['category']]);
                }
            }
        });
    }
}
