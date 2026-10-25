<?php

namespace Origo\Core\Plan\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Origo\Core\Plan\Models\PlanTimesheetEntry;
use Origo\Core\Plan\Models\PlanWeeklyReport;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Support\LocalizedText;

/**
 * A project's weekly report: one entry per week (Monday to Sunday, keyed by its Monday) holding the progress
 * figures frozen when the week was recorded, a written summary and each member's hours.
 */
class WeeklyReports
{
    /** Weeks shown at most, counted back from the current one. */
    public const MAX_WEEKS = 104;

    public function __construct(private readonly PlanSummary $summary) {}

    public static function weekStart(CarbonInterface $day): CarbonImmutable
    {
        return CarbonImmutable::parse($day->toDateString())->startOfWeek(CarbonInterface::MONDAY);
    }

    /** Freezes the plan's figures as they are now under the given week. */
    public function record(Project $project, CarbonInterface $weekStart): PlanWeeklyReport
    {
        $report = $this->report($project, self::weekStart($weekStart)->toDateString());
        $report->fill(['snapshot' => PlanSummary::toSnapshot($this->summary->for($project)), 'snapshot_at' => now()])->save();

        return $report;
    }

    /**
     * @param  array{summary?: array<string, mixed>|null, hours?: array<int|string, float|int|null>}  $data
     */
    public function update(Project $project, CarbonInterface $weekStart, array $data): void
    {
        $week = self::weekStart($weekStart)->toDateString();

        if (array_key_exists('summary', $data)) {
            $summary = $data['summary'] ? LocalizedText::normalize($data['summary']) : null;
            $isEmpty = ! $summary || ! array_filter($summary);
            $this->report($project, $week)->fill(['summary' => $isEmpty ? null : $summary])->save();
        }

        foreach ($data['hours'] ?? [] as $userId => $hours) {
            $entry = PlanTimesheetEntry::query()->where('project_id', $project->id)->where('user_id', (int) $userId)->whereDate('week_start', $week)->first();

            if ($hours === null || (float) $hours <= 0) {
                $entry?->delete();
            } else {
                ($entry ?? new PlanTimesheetEntry(['project_id' => $project->id, 'user_id' => (int) $userId, 'week_start' => $week]))
                    ->fill(['hours' => round((float) $hours, 2)])->save();
            }
        }
    }

    /** Dates are matched by day, so the lookup works whatever time part the database keeps. */
    private function report(Project $project, string $week): PlanWeeklyReport
    {
        return PlanWeeklyReport::query()->where('project_id', $project->id)->whereDate('week_start', $week)->first()
            ?? new PlanWeeklyReport(['project_id' => $project->id, 'week_start' => $week]);
    }

    /**
     * Every week from the plan's first week (or the first one with a report) to the current week.
     *
     * @return list<array{weekStart: string, snapshot: array<string, mixed>|null, snapshotAt: string|null, summary: array<string, mixed>|null, hours: array<int, float>}>
     */
    public function weeks(Project $project): array
    {
        $reports = PlanWeeklyReport::query()->where('project_id', $project->id)->get()->keyBy(fn (PlanWeeklyReport $report) => $report->week_start->toDateString());
        $hours = PlanTimesheetEntry::query()->where('project_id', $project->id)->get()->groupBy(fn (PlanTimesheetEntry $entry) => $entry->week_start->toDateString());
        $current = self::weekStart(now());
        $planStart = $this->summary->for($project)['overall']['startDate'];
        $first = collect([$planStart, $reports->keys()->min(), $hours->keys()->min()])->filter()->min();
        $first = $first ? self::weekStart(CarbonImmutable::parse($first)) : $current;
        $first = $first->max($current->subWeeks(self::MAX_WEEKS - 1));

        $weeks = [];

        for ($week = $first; $week->lte($current->max($first)); $week = $week->addWeek()) {
            $key = $week->toDateString();
            $report = $reports->get($key);
            $weeks[] = [
                'weekStart' => $key,
                'snapshot' => $report?->snapshot,
                'snapshotAt' => $report?->snapshot_at?->toIso8601String(),
                'summary' => $report?->summary ? LocalizedText::normalize($report->summary) : null,
                'hours' => ($hours->get($key) ?? collect())->mapWithKeys(fn (PlanTimesheetEntry $entry) => [$entry->user_id => (float) $entry->hours])->all(),
            ];
        }

        return $weeks;
    }
}
