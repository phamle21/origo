<?php

namespace Origo\Core\Plan\Support;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Origo\Core\Plan\Enums\PlanTaskStatus;
use Origo\Core\Plan\Models\PlanItem;
use Origo\Core\Plan\Models\PlanStage;
use Origo\Core\Plan\Models\PlanStatus;
use Origo\Core\Plan\Models\PlanTask;
use Origo\Core\Project\Models\Project;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * The plan as a project-management workbook laid out like the team's spreadsheet:
 * - "Gantt Chart": summary per stage, one row per feature with an 8-column block per stage (volume, start,
 *   end, P.I.C, status, %, link, note) and a coloured day-by-day chart;
 * - "Weekly Report": hours per member per week, frozen weekly progress and the written summaries;
 * - ".setting": the project's statuses, members and the working calendar.
 * Values are plain (no formulas), so the file reads the same in Excel, Google Sheets and Numbers.
 */
class PlanSpreadsheet
{
    private const BLOCK = ['VOLUME (man-days)', 'Start', 'End', 'P.I.C', 'Status', '%', 'Link', 'Note'];

    private const FIRST_BLOCK_COLUMN = 8; // H, as in the team's sheet

    private const HEADER_ROW = 9;

    private const FIRST_DATA_ROW = 11;

    private const MAX_CHART_DAYS = 730;

    private const DATE_FORMAT = 'yyyy-mm-dd';

    private string $language = 'vi';

    public function __construct(
        private readonly PlanSummary $summary,
        private readonly PlanStatuses $statuses,
        private readonly WeeklyReports $weeklyReports,
        private readonly WorkCalendar $calendar,
    ) {}

    public function build(Project $project, string $language = 'vi'): Spreadsheet
    {
        $this->language = $language;
        $book = new Spreadsheet;
        $book->getProperties()->setCreator('Origo')->setTitle($this->text($project->name).' — Project Management');
        $book->getDefaultStyle()->getFont()->setName('Arial')->setSize(10);

        $this->gantt($book->getActiveSheet(), $project);
        $this->weekly($book->createSheet(), $project);
        $this->settings($book->createSheet(), $project);
        $book->setActiveSheetIndex(0);

        return $book;
    }

    private function gantt(Worksheet $sheet, Project $project): void
    {
        $sheet->setTitle('Gantt Chart');
        $summary = $this->summary->for($project);
        $stages = PlanStage::query()->where('project_id', $project->id)->orderBy('position')->get();
        $statuses = $this->statuses->forProject($project);
        $items = PlanItem::query()->where('project_id', $project->id)->orderBy('position')->get();
        $tasks = PlanTask::query()->whereIn('plan_item_id', $items->pluck('id'))->get()->groupBy('plan_item_id');
        $people = User::query()->whereIn('id', $tasks->flatten()->pluck('assignee_id')->filter()->unique())->pluck('name', 'id');
        $stageFigures = collect($summary['stages'])->keyBy('stageId');
        $chartColumn = self::FIRST_BLOCK_COLUMN + 8 * $stages->count() + 1;

        // Title and overall figures (rows 1–7).
        $sheet->setCellValue('B1', "[{$project->code}] ".$this->text($project->name));
        $sheet->getStyle('B1')->getFont()->setBold(true)->setSize(14);
        $overall = $summary['overall'];
        $this->set($sheet, 4, 3, 'TODAY');
        $this->date($sheet, 5, 3, $summary['today']);
        $this->set($sheet, 4, 4, 'PROGRESS');
        $this->percent($sheet, 5, 4, $overall['progress']);
        $this->set($sheet, 4, 5, $overall['basis'] === 'effort' ? '(man-days)' : '(tasks)');
        $this->set($sheet, 5, 5, $overall['basis'] === 'effort'
            ? sprintf('%s / %s (Remain: %s)', $this->number($overall['actualDays']), $this->number($overall['estimateDays']), $this->number($overall['remainingDays']))
            : "{$overall['doneCount']} / {$overall['taskCount']}");
        $this->set($sheet, 4, 6, 'DAYS PASSED');
        $this->percent($sheet, 5, 6, $overall['timeElapsed']);
        $this->set($sheet, 4, 7, '(work-days)');
        if ($overall['workingDays'] !== null) {
            $this->set($sheet, 5, 7, sprintf('%d / %d (Remain: %d)', $overall['workingDaysPassed'], $overall['workingDays'], $overall['workingDays'] - $overall['workingDaysPassed']));
        }
        $sheet->getStyle('D3:D7')->getFont()->setBold(true);

        foreach ($stages->values() as $index => $stage) {
            $column = self::FIRST_BLOCK_COLUMN + 8 * $index;
            $figures = $stageFigures->get($stage->id);
            $fill = substr($stage->color, 1);

            $this->set($sheet, $column, 1, sprintf('%s %s', $this->circled($index + 1), $this->text($stage->name)));
            $sheet->mergeCells([$column, 1, $column + 6, 1]);
            $this->percent($sheet, $column + 7, 1, $figures['progress'] ?? null);
            $this->paint($sheet, [$column, 1, $column + 7, 1], $fill, true);

            $this->set($sheet, $column, 2, 'Est. Volume');
            $this->set($sheet, $column + 3, 2, $figures['estimateDays'] ?? 0);
            $this->set($sheet, $column + 4, 2, 'Act. Volume');
            $this->set($sheet, $column + 5, 2, $figures['actualDays'] ?? 0);
            $this->set($sheet, $column + 6, 2, 'Remain Volume');
            $this->set($sheet, $column + 7, 2, $figures['remainingDays'] ?? 0);

            $this->set($sheet, $column, 3, $stage->owner ?? '');
            $this->date($sheet, $column + 2, 3, $figures['startDate'] ?? null);
            $this->date($sheet, $column + 4, 3, $figures['endDate'] ?? null);
            if (($figures['workingDays'] ?? null) !== null) {
                $this->set($sheet, $column + 6, 3, "({$figures['workingDays']} work-days)");
            }

            foreach (self::BLOCK as $offset => $label) {
                $this->set($sheet, $column + $offset, self::HEADER_ROW, $label);
            }
            $this->paint($sheet, [$column, self::HEADER_ROW, $column + 7, self::HEADER_ROW], $this->tint($fill, 0.75), false);
        }

        foreach (['P', 'NO.', '', 'PAGE TITLE / To-do', 'Notes', 'START DATE', 'DUE DATE'] as $offset => $label) {
            $this->set($sheet, $offset + 1, self::HEADER_ROW, $label);
        }
        $lastColumn = $chartColumn - 1;
        $header = $sheet->getStyle([1, self::HEADER_ROW, $lastColumn, self::HEADER_ROW]);
        $header->getFont()->setBold(true);
        $header->getAlignment()->setWrapText(true)->setVertical(Alignment::VERTICAL_CENTER)->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $this->paint($sheet, [1, self::HEADER_ROW, 7, self::HEADER_ROW], 'e2e8f0', false);
        $sheet->getRowDimension(self::HEADER_ROW)->setRowHeight(30);

        // The day-by-day chart header.
        $chartStart = $overall['startDate'] ? CarbonImmutable::parse($overall['startDate']) : null;
        $chartEnd = $overall['endDate'] ? CarbonImmutable::parse($overall['endDate'])->min($chartStart?->addDays(self::MAX_CHART_DAYS - 1)) : null;
        $dayColumns = [];
        if ($chartStart && $chartEnd) {
            for ($day = $chartStart, $column = $chartColumn; $day->lte($chartEnd); $day = $day->addDay(), $column++) {
                $dayColumns[$day->toDateString()] = $column;
                if ($day->day === 1 || $day->eq($chartStart)) {
                    $this->set($sheet, $column, 8, $day->format('M Y'));
                }
                $this->set($sheet, $column, self::HEADER_ROW, $day->day);
                $this->set($sheet, $column, self::HEADER_ROW + 1, substr($day->format('D'), 0, 1));
                $sheet->getColumnDimensionByColumn($column)->setWidth(3.2);
                if (! $this->calendar->isWorkingDay($day)) {
                    $this->paint($sheet, [$column, self::HEADER_ROW, $column, self::HEADER_ROW + 1], 'e5e7eb', false);
                }
                if ($day->toDateString() === $summary['today']) {
                    $this->paint($sheet, [$column, self::HEADER_ROW, $column, self::HEADER_ROW + 1], 'fecaca', true);
                }
            }
            $sheet->getStyle([$chartColumn, 8, $column, self::HEADER_ROW + 1])->getFont()->setSize(8);
            $sheet->getStyle([$chartColumn, self::HEADER_ROW, $column, self::HEADER_ROW + 1])->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        // One row per phase, module and feature.
        $row = self::FIRST_DATA_ROW;
        $children = $items->groupBy(fn (PlanItem $item) => $item->parent_id ?? 'root');

        foreach ($children->get('root', collect()) as $phase) {
            $this->set($sheet, 2, $row, $this->text($phase->name));
            $sheet->getStyle([1, $row, $lastColumn, $row])->getFont()->setBold(true);
            $this->paint($sheet, [1, $row, $lastColumn, $row], 'cbd5e1', false);
            $row++;

            foreach ($children->get($phase->id, collect())->values() as $moduleIndex => $module) {
                $this->set($sheet, 2, $row, $moduleIndex + 1);
                $this->set($sheet, 3, $row, $this->text($module->name));
                $this->set($sheet, 5, $row, $module->note ?? '');
                $sheet->getStyle([1, $row, $lastColumn, $row])->getFont()->setBold(true);
                $this->paint($sheet, [1, $row, $lastColumn, $row], 'f1f5f9', false);
                $row++;

                foreach ($children->get($module->id, collect())->values() as $featureIndex => $feature) {
                    $this->featureRow($sheet, $row, $feature, sprintf('%d.%d', $moduleIndex + 1, $featureIndex + 1), $stages, $tasks->get($feature->id, collect()), $statuses, $people, $dayColumns);
                    $row++;
                }
            }
        }

        // Layout: widths, borders, frozen titles.
        foreach ([1 => 5, 2 => 7, 3 => 4, 4 => 42, 5 => 32, 6 => 11, 7 => 11] as $column => $width) {
            $sheet->getColumnDimensionByColumn($column)->setWidth($width);
        }
        foreach ($stages->values() as $index => $stage) {
            foreach ([8, 11, 11, 13, 13, 7, 22, 22] as $offset => $width) {
                $sheet->getColumnDimensionByColumn(self::FIRST_BLOCK_COLUMN + 8 * $index + $offset)->setWidth($width);
            }
        }
        if ($row > self::FIRST_DATA_ROW) {
            $sheet->getStyle([1, self::HEADER_ROW, max($lastColumn, $chartColumn + count($dayColumns) - 1), $row - 1])
                ->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('cbd5e1');
            $sheet->getStyle([1, self::FIRST_DATA_ROW, $lastColumn, $row - 1])->getAlignment()->setVertical(Alignment::VERTICAL_TOP)->setWrapText(true);
        }
        $sheet->freezePane([6, self::FIRST_DATA_ROW]);
        $sheet->setAutoFilter([1, self::HEADER_ROW, $lastColumn, max(self::HEADER_ROW, $row - 1)]);
    }

    /**
     * @param  Collection<int, PlanStage>  $stages
     * @param  Collection<int, PlanTask>  $tasks
     * @param  \Illuminate\Database\Eloquent\Collection<int, PlanStatus>  $statuses
     * @param  Collection<int, string>  $people
     * @param  array<string, int>  $dayColumns
     */
    private function featureRow(Worksheet $sheet, int $row, PlanItem $feature, string $number, Collection $stages, Collection $tasks, $statuses, Collection $people, array $dayColumns): void
    {
        $byStage = $tasks->keyBy('plan_stage_id');
        $this->set($sheet, 1, $row, $feature->priority ? "P{$feature->priority}" : '');
        $this->set($sheet, 2, $row, $number);
        $this->set($sheet, 4, $row, $this->text($feature->name));
        $this->set($sheet, 5, $row, $feature->note ?? '');
        $this->date($sheet, 6, $row, $tasks->min(fn (PlanTask $task) => $task->start_date->toDateString()));
        $this->date($sheet, 7, $row, $tasks->max(fn (PlanTask $task) => $task->end_date->toDateString()));

        foreach ($stages->values() as $index => $stage) {
            $task = $byStage->get($stage->id);
            $column = self::FIRST_BLOCK_COLUMN + 8 * $index;

            if (! $task) {
                continue;
            }

            $status = $this->statuses->resolve($task, $statuses);
            $share = $task->status === PlanTaskStatus::Done ? 1 : ($task->progress !== null ? $task->progress / 100 : null);
            if ($task->estimate_days !== null) {
                $this->set($sheet, $column, $row, (float) $task->estimate_days);
            }
            $this->date($sheet, $column + 1, $row, $task->start_date->toDateString());
            $this->date($sheet, $column + 2, $row, $task->end_date->toDateString());
            $this->set($sheet, $column + 3, $row, $people->get($task->assignee_id) ?? '');
            $this->set($sheet, $column + 4, $row, $status ? $this->text($status->name) : $task->status->value);
            $this->percent($sheet, $column + 5, $row, $share);
            $this->set($sheet, $column + 6, $row, $task->link ?? '');
            $this->set($sheet, $column + 7, $row, $task->note ?? '');

            if ($task->link && preg_match('#^https?://#i', $task->link)) {
                $sheet->getCell([$column + 6, $row])->getHyperlink()->setUrl($task->link);
            }
            if ($status) {
                $this->paint($sheet, [$column + 4, $row, $column + 4, $row], $this->tint(substr($status->color, 1), 0.7), false);
            }

            // The bar: the stage colour, lighter while the task is not done.
            $tone = $task->status === PlanTaskStatus::Done ? substr($stage->color, 1) : $this->tint(substr($stage->color, 1), 0.55);
            $columns = array_values(array_filter(
                $dayColumns,
                fn (string $day) => $day >= $task->start_date->toDateString() && $day <= $task->end_date->toDateString(),
                ARRAY_FILTER_USE_KEY,
            ));
            if ($columns) {
                $this->paint($sheet, [$columns[0], $row, end($columns), $row], $tone, false);
            }
        }
    }

    private function weekly(Worksheet $sheet, Project $project): void
    {
        $sheet->setTitle('Weekly Report');
        $weeks = $this->weeklyReports->weeks($project);
        $members = $project->members()->with('user:id,name')->get()->pluck('user')->filter()->sortBy('name')->values();
        $firstWeekColumn = 4;

        $this->set($sheet, 1, 1, 'Progress is recorded every Monday morning for the week before; hours are entered per member and week.');
        $sheet->getStyle('A1')->getFont()->setItalic(true);

        // Hours per member per week.
        $row = 3;
        $this->set($sheet, 1, $row, 'Time-based Cost (hours)');
        $sheet->getStyle([1, $row])->getFont()->setBold(true)->setSize(12);
        $row++;
        foreach (['No.', 'Full name', 'Total'] as $offset => $label) {
            $this->set($sheet, $offset + 1, $row, $label);
        }
        foreach ($weeks as $index => $week) {
            $this->set($sheet, $firstWeekColumn + $index, $row, $this->weekLabel($week['weekStart']));
        }
        $headerRow = $row;
        $this->paint($sheet, [1, $row, $firstWeekColumn + count($weeks) - 1, $row], 'e2e8f0', true);
        $row++;
        foreach ($members as $index => $member) {
            $this->set($sheet, 1, $row, $index + 1);
            $this->set($sheet, 2, $row, $member->name);
            $total = 0.0;
            foreach ($weeks as $weekIndex => $week) {
                $hours = $week['hours'][$member->id] ?? null;
                if ($hours) {
                    $this->set($sheet, $firstWeekColumn + $weekIndex, $row, $hours);
                    $total += $hours;
                }
            }
            $this->set($sheet, 3, $row, $total);
            $row++;
        }
        $this->set($sheet, 2, $row, 'Total');
        $this->set($sheet, 3, $row, array_sum(array_map(fn ($week) => array_sum($week['hours']), $weeks)));
        foreach ($weeks as $weekIndex => $week) {
            $this->set($sheet, $firstWeekColumn + $weekIndex, $row, array_sum($week['hours']));
        }
        $sheet->getStyle([1, $row, $firstWeekColumn + count($weeks) - 1, $row])->getFont()->setBold(true);
        $this->border($sheet, [1, $headerRow, $firstWeekColumn + count($weeks) - 1, $row]);

        // Frozen progress per stage per week.
        $row += 3;
        $this->set($sheet, 1, $row, 'Project progress');
        $sheet->getStyle([1, $row])->getFont()->setBold(true)->setSize(12);
        $row++;
        $this->set($sheet, 1, $row, 'No.');
        $this->set($sheet, 2, $row, 'Stage');
        $this->set($sheet, 3, $row, 'VOLUME');
        foreach ($weeks as $index => $week) {
            $this->set($sheet, $firstWeekColumn + $index, $row, $this->weekLabel($week['weekStart']));
        }
        $headerRow = $row;
        $this->paint($sheet, [1, $row, $firstWeekColumn + count($weeks) - 1, $row], 'e2e8f0', true);
        $row++;
        $stages = PlanStage::query()->where('project_id', $project->id)->orderBy('position')->get();
        $current = collect($this->summary->for($project)['stages'])->keyBy('stageId');
        foreach ($stages->values() as $index => $stage) {
            $this->set($sheet, 1, $row, $index + 1);
            $this->set($sheet, 2, $row, $this->text($stage->name));
            $this->set($sheet, 3, $row, $current->get($stage->id)['estimateDays'] ?? 0);
            foreach ($weeks as $weekIndex => $week) {
                $figures = collect($week['snapshot']['stages'] ?? [])->firstWhere('stageId', $stage->id);
                $this->percent($sheet, $firstWeekColumn + $weekIndex, $row, $figures['progress'] ?? null);
            }
            $row++;
        }
        $previous = null;
        foreach ([['PROGRESS', 'progress'], ['WEEKLY PROGRESS', 'delta'], ['DAYS PASSED (% work-days)', 'timeElapsed']] as [$label, $field]) {
            $this->set($sheet, 2, $row, $label);
            $previous = null;
            foreach ($weeks as $weekIndex => $week) {
                $overall = $week['snapshot']['overall'] ?? null;
                $value = match ($field) {
                    'delta' => $overall && $previous !== null ? $overall['progress'] - $previous : null,
                    default => $overall[$field] ?? null,
                };
                $previous = $overall['progress'] ?? $previous;
                $this->percent($sheet, $firstWeekColumn + $weekIndex, $row, $value);
            }
            $sheet->getStyle([1, $row, $firstWeekColumn + count($weeks) - 1, $row])->getFont()->setBold(true);
            $row++;
        }
        $this->border($sheet, [1, $headerRow, $firstWeekColumn + count($weeks) - 1, $row - 1]);

        // Written summaries, one row per content language.
        $row += 2;
        $this->set($sheet, 1, $row, 'Weekly Summary');
        $sheet->getStyle([1, $row])->getFont()->setBold(true)->setSize(12);
        $row++;
        foreach ($weeks as $index => $week) {
            $this->set($sheet, $firstWeekColumn + $index, $row, $this->weekLabel($week['weekStart']));
        }
        $this->paint($sheet, [$firstWeekColumn, $row, $firstWeekColumn + count($weeks) - 1, $row], 'e2e8f0', true);
        $languages = collect($weeks)->flatMap(fn ($week) => array_keys(array_filter($week['summary'] ?? [])))->unique()->sort()->values();
        foreach ($languages as $language) {
            $row++;
            $this->set($sheet, 2, $row, strtoupper($language));
            foreach ($weeks as $index => $week) {
                $this->set($sheet, $firstWeekColumn + $index, $row, $week['summary'][$language] ?? '');
            }
            $sheet->getStyle([1, $row, $firstWeekColumn + count($weeks) - 1, $row])->getAlignment()->setWrapText(true)->setVertical(Alignment::VERTICAL_TOP);
        }

        $sheet->getColumnDimension('A')->setWidth(6);
        $sheet->getColumnDimension('B')->setWidth(30);
        $sheet->getColumnDimension('C')->setWidth(10);
        foreach (array_keys($weeks) as $index) {
            $sheet->getColumnDimensionByColumn($firstWeekColumn + $index)->setWidth(16);
        }
        $sheet->freezePane([$firstWeekColumn, 1]);
    }

    private function settings(Worksheet $sheet, Project $project): void
    {
        $sheet->setTitle('.setting');
        foreach (['Status', 'Category', '', 'P.I.C', '', 'Holiday / make-up day', 'Kind', 'Name'] as $offset => $label) {
            $this->set($sheet, $offset + 1, 1, $label);
        }
        $sheet->getStyle('A1:H1')->getFont()->setBold(true);

        foreach ($this->statuses->forProject($project)->values() as $index => $status) {
            $this->set($sheet, 1, $index + 2, $this->text($status->name));
            $this->set($sheet, 2, $index + 2, $status->category->value);
            $this->paint($sheet, [1, $index + 2, 1, $index + 2], $this->tint(substr($status->color, 1), 0.7), false);
        }
        foreach ($project->members()->with('user:id,name')->get()->pluck('user')->filter()->sortBy('name')->values() as $index => $member) {
            $this->set($sheet, 4, $index + 2, $member->name);
        }
        foreach ($this->calendar->all() as $index => $day) {
            $this->date($sheet, 6, $index + 2, $day['date']);
            $this->set($sheet, 7, $index + 2, $day['kind']);
            $this->set($sheet, 8, $index + 2, $day['name'] ?? '');
        }
        foreach (['A' => 20, 'B' => 10, 'D' => 26, 'F' => 22, 'G' => 10, 'H' => 30] as $column => $width) {
            $sheet->getColumnDimension($column)->setWidth($width);
        }
    }

    /** @param  array<string, mixed>|null  $value */
    private function text(?array $value): string
    {
        return trim((string) (($value[$this->language] ?? null) ?: ($value['vi'] ?? null) ?: collect($value ?? [])->filter()->first() ?: ''));
    }

    private function set(Worksheet $sheet, int $column, int $row, mixed $value): void
    {
        $sheet->setCellValue([$column, $row], $value);
    }

    private function date(Worksheet $sheet, int $column, int $row, ?string $date): void
    {
        if ($date) {
            $sheet->setCellValue([$column, $row], ExcelDate::PHPToExcel(CarbonImmutable::parse($date)->startOfDay()));
            $sheet->getStyle([$column, $row])->getNumberFormat()->setFormatCode(self::DATE_FORMAT);
        }
    }

    private function percent(Worksheet $sheet, int $column, int $row, float|int|null $value): void
    {
        if ($value !== null) {
            $sheet->setCellValue([$column, $row], round((float) $value, 4));
            $sheet->getStyle([$column, $row])->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_PERCENTAGE);
        }
    }

    /** @param  array{0: int, 1: int, 2: int, 3: int}  $range */
    private function paint(Worksheet $sheet, array $range, string $rgb, bool $bold): void
    {
        $style = $sheet->getStyle($range);
        $style->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB($rgb);

        if ($bold) {
            $style->getFont()->setBold(true);
        }

        // Dark fills get white text, so stage headers stay readable.
        if ($this->isDark($rgb)) {
            $style->getFont()->getColor()->setRGB('ffffff');
        }
    }

    /** @param  array{0: int, 1: int, 2: int, 3: int}  $range */
    private function border(Worksheet $sheet, array $range): void
    {
        $sheet->getStyle($range)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('cbd5e1');
    }

    /** Mixes a colour with white; $amount 0 keeps it, 1 is white. */
    private function tint(string $rgb, float $amount): string
    {
        return implode('', array_map(fn (string $hex) => str_pad(dechex((int) round(hexdec($hex) + (255 - hexdec($hex)) * $amount)), 2, '0', STR_PAD_LEFT), str_split($rgb, 2)));
    }

    private function isDark(string $rgb): bool
    {
        [$red, $green, $blue] = array_map('hexdec', str_split($rgb, 2));

        return (0.299 * $red + 0.587 * $green + 0.114 * $blue) < 150;
    }

    private function circled(int $number): string
    {
        return $number <= 20 ? mb_chr(0x2460 + $number - 1) : "({$number})";
    }

    private function number(float $value): string
    {
        return rtrim(rtrim(number_format($value, 2, '.', ''), '0'), '.');
    }

    private function weekLabel(string $weekStart): string
    {
        $monday = CarbonImmutable::parse($weekStart);

        return sprintf('`%s| %s~%s', $monday->format('y'), $monday->format('n/j'), $monday->addDays(4)->format('n/j'));
    }
}
