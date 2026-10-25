<?php

namespace Origo\Core\Plan\Console;

use Illuminate\Console\Command;
use Origo\Core\Plan\Models\PlanTask;
use Origo\Core\Plan\Support\WeeklyReports;
use Origo\Core\Project\Models\Project;

/** Every Monday morning: freezes last week's progress figures in each active project's weekly report. */
class RecordWeeklySnapshots extends Command
{
    protected $signature = 'origo:plan-weekly-snapshot {--week= : Monday (Y-m-d) of the week to record; defaults to last week}';

    protected $description = 'Record the weekly progress snapshot of every active project';

    public function handle(WeeklyReports $reports): int
    {
        $week = $this->option('week') ? WeeklyReports::weekStart(now()->parse($this->option('week'))) : WeeklyReports::weekStart(now()->subWeek());
        $count = 0;

        Project::query()->whereNull('archived_at')->each(function (Project $project) use ($reports, $week, &$count) {
            $hasTasks = PlanTask::query()->whereIn('plan_item_id', $project->planItems()->select('id'))->exists();

            if ($hasTasks) {
                $reports->record($project, $week);
                $count++;
            }
        });

        $this->components->info("Recorded the week of {$week->toDateString()} for {$count} project(s).");

        return self::SUCCESS;
    }
}
