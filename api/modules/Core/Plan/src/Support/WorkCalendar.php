<?php

namespace Origo\Core\Plan\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Origo\Core\Plan\Models\WorkCalendarDay;

/**
 * Working days: Monday to Friday, minus public holidays, plus make-up working days. The exceptions are read
 * once per instance, so one request or export counts many ranges cheaply.
 */
class WorkCalendar
{
    /** @var array<string, string>|null date (Y-m-d) => kind */
    private ?array $exceptions = null;

    /** @return array<string, string> */
    public function exceptions(): array
    {
        return $this->exceptions ??= WorkCalendarDay::query()->orderBy('date')->get()
            ->mapWithKeys(fn (WorkCalendarDay $day) => [$day->date->toDateString() => $day->kind])
            ->all();
    }

    public function isWorkingDay(CarbonInterface $day): bool
    {
        return match ($this->exceptions()[$day->toDateString()] ?? null) {
            WorkCalendarDay::HOLIDAY => false,
            WorkCalendarDay::WORKDAY => true,
            default => ! $day->isWeekend(),
        };
    }

    /** Working days from start to end, both included; 0 when the range is empty. */
    public function workingDays(CarbonInterface $start, CarbonInterface $end): int
    {
        $count = 0;

        for ($day = CarbonImmutable::parse($start->toDateString()); $day->lte($end); $day = $day->addDay()) {
            $count += $this->isWorkingDay($day) ? 1 : 0;
        }

        return $count;
    }

    /** @return list<array{date: string, kind: string, name: string|null}> */
    public function all(): array
    {
        return WorkCalendarDay::query()->orderBy('date')->get()
            ->map(fn (WorkCalendarDay $day) => ['date' => $day->date->toDateString(), 'kind' => $day->kind, 'name' => $day->name])
            ->all();
    }

    /**
     * Replaces the whole list.
     *
     * @param  array<int, array{date: string, kind: string, name?: string|null}>  $days
     */
    public function save(array $days): void
    {
        DB::transaction(function () use ($days) {
            WorkCalendarDay::query()->delete();

            foreach (collect($days)->keyBy('date') as $day) {
                WorkCalendarDay::create(['date' => $day['date'], 'kind' => $day['kind'], 'name' => trim((string) ($day['name'] ?? '')) ?: null]);
            }
        });

        $this->exceptions = null;
    }
}
