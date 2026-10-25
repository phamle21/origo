<?php

namespace Origo\Core\Plan\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Origo\Core\Plan\Enums\PlanItemKind;
use Origo\Core\Plan\Enums\PlanTaskStatus;
use Origo\Core\Plan\Models\PlanItem;
use Origo\Core\Plan\Models\PlanStage;
use Origo\Core\Plan\Models\PlanTask;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Support\LocalizedText;

/**
 * Progress figures of a plan, per stage and overall, as in a project-management spreadsheet:
 * - estimate: planned man-days; actual: man-days finished (estimate × done share); remaining: the rest;
 * - a task's done share is 1 when its status is done, otherwise its progress % (0 when unset);
 * - progress weighs tasks by their estimate; where nothing is estimated it falls back to counting tasks
 *   (`basis` says which was used);
 * - time elapsed counts working days (see WorkCalendar) from the plan's first day to today.
 */
class PlanSummary
{
    public function __construct(private readonly WorkCalendar $calendar) {}

    /**
     * @return array{
     *     today: string,
     *     overall: array<string, mixed>,
     *     stages: list<array<string, mixed>>
     * }
     */
    public function for(Project $project, ?CarbonInterface $today = null): array
    {
        $today = CarbonImmutable::parse(($today ?? now())->toDateString());
        $stages = PlanStage::query()->where('project_id', $project->id)->orderBy('position')->get();
        $featureIds = PlanItem::query()->where('project_id', $project->id)->where('kind', PlanItemKind::Feature)->pluck('id');
        $tasks = PlanTask::query()->whereIn('plan_item_id', $featureIds)->get();

        $stageFigures = $stages->map(function (PlanStage $stage) use ($tasks, $today) {
            $stageTasks = $tasks->where('plan_stage_id', $stage->id);
            $start = $stage->start_date ?? $this->earliest($stageTasks);
            $end = $stage->end_date ?? $this->latest($stageTasks);

            return [
                'stageId' => $stage->id,
                'name' => LocalizedText::normalize($stage->name),
                'owner' => $stage->owner,
                ...$this->effort($stageTasks),
                'startDate' => $start?->toDateString(),
                'endDate' => $end?->toDateString(),
                'workingDays' => $start && $end ? $this->calendar->workingDays($start, $end) : null,
                'isLate' => $end !== null && $end->lt($today) && $stageTasks->contains(fn (PlanTask $task) => $task->status !== PlanTaskStatus::Done),
            ];
        })->values()->all();

        $start = collect([$this->earliest($tasks), ...$stages->pluck('start_date')])->filter()->min();
        $end = collect([$this->latest($tasks), ...$stages->pluck('end_date')])->filter()->max();
        $workingDays = $start && $end ? $this->calendar->workingDays($start, $end) : null;
        $passed = $start && $end ? ($today->lt($start) ? 0 : $this->calendar->workingDays($start, $today->min($end))) : null;

        return [
            'today' => $today->toDateString(),
            'overall' => [
                ...$this->effort($tasks),
                'startDate' => $start?->toDateString(),
                'endDate' => $end?->toDateString(),
                'workingDays' => $workingDays,
                'workingDaysPassed' => $passed,
                'timeElapsed' => $workingDays ? round($passed / $workingDays, 4) : null,
                'taskCount' => $tasks->count(),
                'doneCount' => $tasks->where('status', PlanTaskStatus::Done)->count(),
            ],
            'stages' => $stageFigures,
        ];
    }

    /**
     * The figures a weekly report keeps for a week, so later edits to the plan do not change history.
     *
     * @param  array{overall: array<string, mixed>, stages: list<array<string, mixed>>}  $summary
     * @return array<string, mixed>
     */
    public static function toSnapshot(array $summary): array
    {
        $keep = fn (array $figures) => array_intersect_key($figures, array_flip(['estimateDays', 'actualDays', 'remainingDays', 'progress', 'basis']));

        return [
            'overall' => [...$keep($summary['overall']), 'timeElapsed' => $summary['overall']['timeElapsed'], 'doneCount' => $summary['overall']['doneCount'], 'taskCount' => $summary['overall']['taskCount']],
            'stages' => array_map(fn (array $stage) => ['stageId' => $stage['stageId'], 'name' => $stage['name'], ...$keep($stage)], $summary['stages']),
        ];
    }

    /**
     * @param  Collection<int, PlanTask>  $tasks
     * @return array{estimateDays: float, actualDays: float, remainingDays: float, progress: float|null, basis: string}
     */
    private function effort(Collection $tasks): array
    {
        $estimate = (float) $tasks->sum(fn (PlanTask $task) => (float) $task->estimate_days);
        $actual = (float) $tasks->sum(fn (PlanTask $task) => (float) $task->estimate_days * $this->doneShare($task));
        $isEffort = $estimate > 0;

        return [
            'estimateDays' => round($estimate, 2),
            'actualDays' => round($actual, 2),
            'remainingDays' => round($estimate - $actual, 2),
            'progress' => match (true) {
                $isEffort => round($actual / $estimate, 4),
                $tasks->isNotEmpty() => round($tasks->avg(fn (PlanTask $task) => $this->doneShare($task)), 4),
                default => null,
            },
            'basis' => $isEffort ? 'effort' : 'count',
        ];
    }

    private function doneShare(PlanTask $task): float
    {
        return $task->status === PlanTaskStatus::Done ? 1.0 : min(100, max(0, (int) $task->progress)) / 100;
    }

    /** @param  Collection<int, PlanTask>  $tasks */
    private function earliest(Collection $tasks): ?CarbonImmutable
    {
        $date = $tasks->min(fn (PlanTask $task) => $task->start_date->toDateString());

        return $date ? CarbonImmutable::parse($date) : null;
    }

    /** @param  Collection<int, PlanTask>  $tasks */
    private function latest(Collection $tasks): ?CarbonImmutable
    {
        $date = $tasks->max(fn (PlanTask $task) => $task->end_date->toDateString());

        return $date ? CarbonImmutable::parse($date) : null;
    }
}
