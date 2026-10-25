<?php

namespace Origo\Core\Plan\Support\Excel;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Origo\Core\Plan\Enums\PlanTaskStatus;
use Origo\Core\Plan\Models\PlanItem;
use Origo\Core\Plan\Models\PlanStage;
use Origo\Core\Plan\Models\PlanStatus;
use Origo\Core\Plan\Models\PlanTask;
use Origo\Core\Plan\Support\PlanStatuses;
use Origo\Core\Plan\Support\PlanSummary;
use Origo\Core\Plan\Support\WeeklyReports;
use Origo\Core\Plan\Support\WorkCalendar;
use Origo\Core\Project\Models\Project;
use PhpOffice\PhpSpreadsheet\Calculation\Calculation;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Fills the team's own project-management template with a plan, the way a person would: only the cells
 * people type into get values; every formula, format, drop-down and conditional format stays as it is.
 * Formulas Google Sheets exported for itself (IFERROR(__xludf.DUMMYFUNCTION(…), cached)) keep their
 * text and get a fresh cached result, so the file reads right in Excel and recalculates in Google Sheets.
 */
class TemplateFiller
{
    private const CHART_MARK = '〇';

    private string $language = 'vi';

    /** @var array<int, array<string, array<string, mixed>>> stage block → status text → the look of its cell */
    private array $statusStyles = [];

    /** @var array<int, string> user id → the name written in P.I.C cells */
    private array $picNames = [];

    public function __construct(
        private readonly PlanSummary $summary,
        private readonly PlanStatuses $statuses,
        private readonly WeeklyReports $weeklyReports,
        private readonly WorkCalendar $calendar,
    ) {}

    /**
     * @param  array<int, array<string, array<string, mixed>>>  $statusStyles  see TemplateCleaner
     */
    public function fill(string $templatePath, string $ganttSheet, Project $project, string $language = 'vi', array $statusStyles = []): Spreadsheet
    {
        $this->language = $language;
        $this->statusStyles = $statusStyles;
        $book = IOFactory::load($templatePath);
        $gantt = $book->getSheetByNameOrThrow($ganttSheet);
        $setting = $book->getSheetByNameOrThrow(TemplateLayout::SETTING_SHEET);

        $stages = PlanStage::query()->where('project_id', $project->id)->orderBy('position')->get()->values();
        $members = $project->members()->with('user:id,name')->get()->pluck('user')->filter()->sortBy('name')->values();
        $summary = $this->summary->for($project);
        $chartStart = $this->chartStart($stages, $summary);
        $this->picNames = $this->picNames($members);

        $this->fillSetting($setting, $members);
        $statusLabels = $this->statusLabels($setting, $this->statuses->forProject($project));
        $this->fillGantt($gantt, $project, $stages, $statusLabels, $chartStart);

        if ($book->sheetNameExists(TemplateLayout::WEEKLY_SHEET) && TemplateLayout::isWeeklySheet($book->getSheetByNameOrThrow(TemplateLayout::WEEKLY_SHEET))) {
            $this->fillWeekly($book->getSheetByNameOrThrow(TemplateLayout::WEEKLY_SHEET), $project, $stages, $members, $summary, $chartStart);
        }

        $this->refreshGoogleHeaderFormulas($gantt);
        $book->getProperties()->setTitle($this->text($project->name).' — Project Management');
        $book->setActiveSheetIndex($book->getIndex($gantt));

        return $book;
    }

    /**
     * @param  Collection<int, PlanStage>  $stages
     * @param  array<int|string, string>  $statusLabels  by project status id
     */
    private function fillGantt(Worksheet $sheet, Project $project, Collection $stages, array $statusLabels, CarbonImmutable $chartStart): void
    {
        $lastColumn = TemplateLayout::chartLastColumn($sheet);
        $prototypes = array_map(fn (int $row) => TemplateRows::capture($sheet, $row, $lastColumn), TemplateLayout::PROTOTYPE_ROWS);
        $rows = $this->rows($project);
        $templateRows = count(TemplateLayout::PROTOTYPE_ROWS);
        $last = TemplateLayout::PROTOTYPE_ROWS['phase'];

        // Make room: as many rows as the plan needs, inserted inside the data area so ranges grow with it.
        if (count($rows) > $templateRows) {
            $sheet->insertNewRowBefore($last, count($rows) - $templateRows);
        } elseif (count($rows) < $templateRows) {
            $sheet->removeRow(TemplateLayout::FIRST_DATA_ROW + max(1, count($rows)), $templateRows - max(1, count($rows)));
        }
        foreach ($sheet->getMergeCells() as $range) {
            $mergedRows = array_map(fn ($ref) => (int) Coordinate::coordinateFromString($ref)[1], explode(':', $range));
            if (min($mergedRows) > TemplateLayout::FIRST_DATA_ROW) {
                $sheet->unmergeCells($range);
            }
        }

        // Header: title, stage titles, the stage windows and owners, and the day the chart starts.
        $sheet->getCell(TemplateLayout::TITLE_CELL)->setValue("[{$project->code}] ".$this->text($project->name));
        $phaseLabel = $rows[0]['label'] ?? null;
        $this->setIfInput($sheet, TemplateLayout::PHASE_LABEL_CELL, $phaseLabel);
        for ($block = 0; $block < TemplateLayout::BLOCK_COUNT; $block++) {
            $stage = $stages->get($block);
            $titleCell = Coordinate::stringFromColumnIndex(TemplateLayout::BLOCK_START_COLUMN + $block * TemplateLayout::BLOCK_WIDTH).'1';
            $this->setIfInput($sheet, $titleCell, $stage ? $this->circled($block + 1).$this->stageTitle($stage) : null);

            [$ownerCell, , $endCell] = TemplateLayout::WINDOW_CELLS[$block];
            if ($ownerCell) {
                $this->setIfInput($sheet, $ownerCell, $stage?->owner);
            }
            $this->setDate($sheet, $endCell, $stage?->end_date?->toDateString());
        }
        // Neighbouring stages share a cell (one's end is the next one's start); starts go last and win.
        foreach (TemplateLayout::WINDOW_CELLS as $block => [, $startCell]) {
            if ($date = $stages->get($block)?->start_date) {
                $this->setDate($sheet, $startCell, $date->toDateString());
            }
        }
        $this->setDate($sheet, TemplateLayout::CHART_START_CELL, $chartStart->toDateString());
        $this->refreshWeekdayLetters($sheet, $chartStart, $lastColumn);

        // Rows.
        $minColumns = $this->columnsIn((string) ($prototypes['feature']->cells[6]['formula'] ?? ''));
        $maxColumns = $this->columnsIn((string) ($prototypes['feature']->cells[7]['formula'] ?? ''));
        foreach ($rows as $index => $row) {
            $target = TemplateLayout::FIRST_DATA_ROW + $index;
            $prototype = $index === 0 ? $prototypes['firstPhase'] : $prototypes[$row['kind']];
            $days = $row['kind'] === 'feature' ? $this->chartDays($row['tasks'], $stages, $minColumns, $maxColumns) : null;

            if ($index > 0 || $prototype->row !== $target) {
                $prototype->apply($sheet, $target, fn (int $column) => $column >= TemplateLayout::CHART_FIRST_COLUMN
                    ? (isset($days) && $this->isMarked($chartStart->addDays($column - TemplateLayout::CHART_FIRST_COLUMN), $days) ? self::CHART_MARK : '')
                    : null);
            }

            $this->fillRow($sheet, $target, $row, $stages, $statusLabels);
        }
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  Collection<int, PlanStage>  $stages
     * @param  array<int|string, string>  $statusLabels
     */
    private function fillRow(Worksheet $sheet, int $target, array $row, Collection $stages, array $statusLabels): void
    {
        match ($row['kind']) {
            'phase' => [$this->setIfInput($sheet, "B{$target}", $row['label']), $this->setIfInput($sheet, "D{$target}", $row['title'])],
            'module' => [$this->setIfInput($sheet, "B{$target}", $row['number']), $this->setIfInput($sheet, "C{$target}", $row['title']), $this->setIfInput($sheet, "E{$target}", $row['note'])],
            default => [$this->setIfInput($sheet, "A{$target}", $row['priority'] ? "P{$row['priority']}" : null), $this->setIfInput($sheet, "D{$target}", $row['title']), $this->setText($sheet, "E{$target}", $row['note'])],
        };

        if ($row['kind'] !== 'feature') {
            return;
        }

        $tasks = $row['tasks']->keyBy('plan_stage_id');
        foreach ($stages->take(TemplateLayout::BLOCK_COUNT)->values() as $block => $stage) {
            $task = $tasks->get($stage->id);
            if (! $task) {
                continue;
            }

            $column = TemplateLayout::BLOCK_START_COLUMN + $block * TemplateLayout::BLOCK_WIDTH;
            $at = fn (int $offset) => Coordinate::stringFromColumnIndex($column + $offset).$target;
            $share = $task->status === PlanTaskStatus::Done ? 1 : ($task->progress !== null ? $task->progress / 100 : null);

            $this->setIfInput($sheet, $at(0), $task->estimate_days !== null ? (float) $task->estimate_days : null);
            $this->setDate($sheet, $at(1), $task->start_date->toDateString());
            $this->setDate($sheet, $at(2), $task->end_date->toDateString());
            $label = $statusLabels[$task->plan_status_id ?? ''] ?? $statusLabels[$task->status->value] ?? null;
            $this->setIfInput($sheet, $at(3), $task->assignee_id ? ($this->picNames[$task->assignee_id] ?? $task->assignee?->name) : null);
            $this->setIfInput($sheet, $at(4), $label);
            if ($label && isset($this->statusStyles[$block][$label])) {
                $sheet->getStyle($at(4))->applyFromArray($this->statusStyles[$block][$label]);
            }
            $this->setIfInput($sheet, $at(5), $share);
            $this->setText($sheet, $at(6), $task->link);
            $this->setText($sheet, $at(7), $task->note);
        }
    }

    /**
     * @param  Collection<int, PlanStage>  $stages
     * @param  Collection<int, User>  $members
     * @param  array<string, mixed>  $summary
     */
    private function fillWeekly(Worksheet $sheet, Project $project, Collection $stages, Collection $members, array $summary, CarbonImmutable $chartStart): void
    {
        $first = TemplateLayout::WEEK_FIRST_COLUMN;
        $lastWeek = TemplateLayout::lastWeekColumn($sheet);
        $startWeek = WeeklyReports::weekStart($chartStart);
        $weeks = collect($this->weeklyReports->weeks($project))->keyBy('weekStart');
        $columnOf = function (string $weekStart) use ($startWeek, $first, $lastWeek): ?int {
            $column = $first + intdiv((int) $startWeek->diffInDays(CarbonImmutable::parse($weekStart), false), 7);

            return $column >= $first && $column <= $lastWeek ? $column : null;
        };

        $this->setDate($sheet, 'C3', $chartStart->toDateString());
        $current = $columnOf(WeeklyReports::weekStart(now())->toDateString());
        $this->setIfInput($sheet, 'E4', $current !== null ? $current - $first + 1 : null);

        // Members and their hours.
        $header = (int) TemplateLayout::findRow($sheet, 'A', fn ($text) => $text === 'No.');
        $memberRows = [];
        for ($row = $header + 1; is_numeric($sheet->getCell("A{$row}")->getValue()); $row++) {
            $memberRows[] = $row;
        }
        foreach ($members->take(count($memberRows))->values() as $index => $member) {
            $row = $memberRows[$index];
            $this->setIfInput($sheet, "C{$row}", $member->name);
            foreach ($weeks as $weekStart => $week) {
                $column = $columnOf($weekStart);
                if ($column !== null && ($week['hours'][$member->id] ?? null)) {
                    $this->setIfInput($sheet, [$column, $row], (float) $week['hours'][$member->id]);
                }
            }
        }

        // Recorded weeks: their date, each stage's progress, the overall progress and time passed.
        foreach ($weeks as $weekStart => $week) {
            $column = $columnOf($weekStart);
            if ($column !== null && $week['snapshotAt']) {
                $this->setDate($sheet, [$column, 2], CarbonImmutable::parse($week['snapshotAt'])->toDateString());
            }
        }

        $section = TemplateLayout::findRow($sheet, 'A', fn ($text) => (bool) preg_match('/^Phase\s*0*1\b/i', $text));
        if ($section) {
            $stageRows = [];
            for ($row = $section + 1; is_numeric($sheet->getCell("A{$row}")->getValue()); $row++) {
                $stageRows[] = $row;
            }
            if ($stageRows && $stages->count() > count($stageRows)) {
                $extra = $stages->count() - count($stageRows);
                $lastStageRow = end($stageRows);
                $copy = TemplateRows::capture($sheet, $lastStageRow, $lastWeek);
                $sheet->insertNewRowBefore($lastStageRow + 1, $extra);
                for ($i = 1; $i <= $extra; $i++) {
                    $copy->apply($sheet, $lastStageRow + $i);
                    $sheet->getCell('A'.($lastStageRow + $i))->setValue(count($stageRows) + $i);
                    $stageRows[] = $lastStageRow + $i;
                }
            }
            $figures = collect($summary['stages'])->keyBy('stageId');
            foreach ($stages->values() as $index => $stage) {
                $row = $stageRows[$index] ?? null;
                if (! $row) {
                    break;
                }
                $this->setIfInput($sheet, "B{$row}", $this->stageTitle($stage));
                $this->setIfInput($sheet, "D{$row}", (float) ($figures->get($stage->id)['estimateDays'] ?? 0));
                foreach ($weeks as $weekStart => $week) {
                    $column = $columnOf($weekStart);
                    $progress = collect($week['snapshot']['stages'] ?? [])->firstWhere('stageId', $stage->id)['progress'] ?? null;
                    if ($column !== null && $progress !== null) {
                        $this->setIfInput($sheet, [$column, $row], round((float) $progress, 4));
                    }
                }
            }

            $progressRow = TemplateLayout::findRow($sheet, 'C', fn ($text) => str_starts_with($text, 'PROGRESS'), $section);
            $daysRow = TemplateLayout::findRow($sheet, 'C', fn ($text) => str_starts_with($text, 'DAYS PASSED'), $section);
            foreach ($weeks as $weekStart => $week) {
                $column = $columnOf($weekStart);
                if ($column === null || ! $week['snapshot']) {
                    continue;
                }
                if ($progressRow) {
                    $this->setIfInput($sheet, [$column, $progressRow], round((float) ($week['snapshot']['overall']['progress'] ?? 0), 4));
                }
                if ($daysRow && $week['snapshot']['overall']['timeElapsed'] !== null) {
                    $this->setIfInput($sheet, [$column, $daysRow], round((float) $week['snapshot']['overall']['timeElapsed'], 4));
                }
            }
        }

        // Summaries: the typed row in the chosen language; the translation row keeps its formula.
        $summaryRow = (int) TemplateLayout::findRow($sheet, 'A', fn ($text) => $text === 'Weekly Summary');
        foreach ($weeks as $weekStart => $week) {
            $column = $columnOf($weekStart);
            if ($column === null || ! $week['summary']) {
                continue;
            }
            $this->setIfInput($sheet, [$column, $summaryRow + 1], $week['summary'][$this->language] ?? $week['summary']['vi'] ?? null);
            $translation = $sheet->getCell([$column, $summaryRow + 2]);
            if ($translation->isFormula()) {
                $translation->setValue(TemplateRows::withCachedValue((string) $translation->getValue(), (string) ($week['summary']['ja'] ?? '')));
            }
        }
    }

    /** @param  Collection<int, User>  $members */
    private function fillSetting(Worksheet $sheet, Collection $members): void
    {
        [$column, $from, $to] = TemplateLayout::PIC_RANGE;
        foreach ($members->take($to - $from + 1)->values() as $index => $member) {
            $this->setIfInput($sheet, $column.($from + $index), $this->picNames[$member->id] ?? $member->name);
        }

        $days = collect($this->calendar->all());
        foreach (['holiday' => TemplateLayout::HOLIDAY_RANGE, 'workday' => TemplateLayout::WORKDAY_RANGE] as $kind => [$dateColumn, $from, $to]) {
            $nameColumn = Coordinate::stringFromColumnIndex(Coordinate::columnIndexFromString($dateColumn) + 1);
            // The sheet's formulas only look at this many rows; the latest days matter most for a live plan.
            foreach ($days->where('kind', $kind)->sortBy('date')->take(-($to - $from + 1))->values() as $index => $day) {
                $this->setDate($sheet, $dateColumn.($from + $index), $day['date']);
                $this->setIfInput($sheet, $nameColumn.($from + $index), $day['name']);
            }
        }
    }

    /**
     * Each project status → the template's own status text (its conditional colours test those words): the
     * same name, else the template status that names the category, else its first status.
     *
     * @param  \Illuminate\Database\Eloquent\Collection<int, PlanStatus>  $statuses
     * @return array<string, string>
     */
    private function statusLabels(Worksheet $setting, $statuses): array
    {
        $labels = [];
        for ($row = 2; ($text = trim((string) $setting->getCell(TemplateLayout::STATUS_COLUMN.$row)->getValue())) !== ''; $row++) {
            $labels[] = $text;
        }
        if (! $labels) {
            return [];
        }

        $bare = fn (string $label) => mb_strtolower(trim(preg_replace('/^\d+\.\s*/', '', $label)));
        $byCategory = [
            'todo' => collect($labels)->first(fn ($label) => in_array($bare($label), ['new', 'todo', 'to do'], true)) ?? $labels[0],
            'doing' => collect($labels)->first(fn ($label) => in_array($bare($label), ['doing', 'in progress'], true)) ?? $labels[0],
            'done' => collect($labels)->first(fn ($label) => $bare($label) === 'done') ?? $labels[0],
        ];

        $map = $byCategory;
        foreach ($statuses as $status) {
            $names = array_map(fn ($name) => mb_strtolower(trim((string) $name)), array_filter($status->name));
            $map[$status->id] = collect($labels)->first(fn ($label) => in_array($bare($label), $names, true)) ?? $byCategory[$status->category->value];
        }

        return $map;
    }

    /**
     * Phase, module and feature rows in plan order.
     *
     * @return list<array<string, mixed>>
     */
    private function rows(Project $project): array
    {
        $items = PlanItem::query()->where('project_id', $project->id)->orderBy('position')->get();
        $tasks = PlanTask::query()->whereIn('plan_item_id', $items->pluck('id'))->with('assignee:id,name')->get()->groupBy('plan_item_id');
        $children = $items->groupBy(fn (PlanItem $item) => $item->parent_id ?? 'root');
        $rows = [];

        foreach ($children->get('root', collect()) as $phase) {
            [$label, $title] = array_pad(explode(' · ', $this->text($phase->name), 2), 2, null);
            $rows[] = ['kind' => 'phase', 'label' => $label, 'title' => $title];

            foreach ($children->get($phase->id, collect())->values() as $moduleIndex => $module) {
                $rows[] = ['kind' => 'module', 'number' => $moduleIndex, 'title' => $this->text($module->name), 'note' => $module->note];

                foreach ($children->get($module->id, collect()) as $feature) {
                    $rows[] = ['kind' => 'feature', 'title' => $this->text($feature->name), 'note' => $feature->note, 'priority' => $feature->priority, 'tasks' => $tasks->get($feature->id, collect())];
                }
            }
        }

        return $rows;
    }

    /**
     * The days a feature's chart row marks, as the template's START/DUE formulas compute them: from the
     * earliest start to the latest end of the stage blocks those formulas read.
     *
     * @param  Collection<int, PlanTask>  $tasks
     * @param  Collection<int, PlanStage>  $stages
     * @param  list<int>  $minColumns
     * @param  list<int>  $maxColumns
     * @return array{0: string, 1: string}|null
     */
    private function chartDays(Collection $tasks, Collection $stages, array $minColumns, array $maxColumns): ?array
    {
        $byColumn = [];
        foreach ($stages->take(TemplateLayout::BLOCK_COUNT)->values() as $block => $stage) {
            $task = $tasks->firstWhere('plan_stage_id', $stage->id);
            if ($task) {
                $column = TemplateLayout::BLOCK_START_COLUMN + $block * TemplateLayout::BLOCK_WIDTH;
                $byColumn[$column + 1] = $task->start_date->toDateString();
                $byColumn[$column + 2] = $task->end_date->toDateString();
            }
        }

        $starts = array_values(array_intersect_key($byColumn, array_flip($minColumns ?: array_keys($byColumn))));
        $ends = array_values(array_intersect_key($byColumn, array_flip($maxColumns ?: array_keys($byColumn))));

        return $starts && $ends ? [min($starts), max($ends)] : null;
    }

    /** @param  array{0: string, 1: string}  $days */
    private function isMarked(CarbonImmutable $day, array $days): bool
    {
        $date = $day->toDateString();

        return $date >= $days[0] && $date <= $days[1] && $this->calendar->isWorkingDay($day);
    }

    /** Column numbers a START/DUE formula reads, e.g. MIN(I12,Q12,…) → I, Q, … */
    private function columnsIn(string $formula): array
    {
        preg_match_all('/\b([A-Z]{1,3})\d+\b/', $formula, $matches);

        return array_values(array_unique(array_map(fn ($letters) => Coordinate::columnIndexFromString($letters), $matches[1])));
    }

    /**
     * @param  Collection<int, PlanStage>  $stages
     * @param  array<string, mixed>  $summary
     */
    private function chartStart(Collection $stages, array $summary): CarbonImmutable
    {
        $date = $stages->first()?->start_date?->toDateString() ?? $summary['overall']['startDate'] ?? now()->toDateString();

        return CarbonImmutable::parse($date);
    }

    /** The weekday letters under the chart dates are cached results of one array formula; refresh them. */
    private function refreshWeekdayLetters(Worksheet $sheet, CarbonImmutable $chartStart, int $lastColumn): void
    {
        $row = TemplateLayout::FIRST_DATA_ROW;
        for ($column = TemplateLayout::CHART_FIRST_COLUMN + 1; $column <= $lastColumn; $column++) {
            $cell = $sheet->getCell([$column, $row]);
            if (! $cell->isFormula()) {
                $cell->setValue(substr($chartStart->addDays($column - TemplateLayout::CHART_FIRST_COLUMN)->format('D'), 0, 1));
            }
        }
    }

    /**
     * The team writes people by the name they go by (the last word of a Vietnamese name, e.g. "Hoàng"); the
     * full name is kept where two people would share one, or for one-word names.
     *
     * @param  Collection<int, User>  $members
     * @return array<int, string>
     */
    private function picNames(Collection $members): array
    {
        $short = $members->mapWithKeys(function (User $member) {
            $words = preg_split('/\s+/u', trim(preg_replace('/\s*\(.*?\)\s*/u', ' ', $member->name)));

            return [$member->id => (string) end($words)];
        });
        $taken = array_count_values($short->all());

        return $members->mapWithKeys(fn (User $member) => [$member->id => $taken[$short[$member->id]] === 1 && $short[$member->id] !== '' ? $short[$member->id] : $member->name])->all();
    }

    /**
     * Header figures Google Sheets computes with its own functions (e.g. TO_PERCENT) are exported with a
     * cached result; that result is worked out again from the filled sheet.
     */
    private function refreshGoogleHeaderFormulas(Worksheet $sheet): void
    {
        for ($row = 1; $row < TemplateLayout::HEADER_ROW; $row++) {
            for ($column = 1; $column <= TemplateLayout::LAST_BLOCK_COLUMN + 2; $column++) {
                $cell = $sheet->getCell([$column, $row]);
                $google = $cell->isFormula() ? TemplateRows::googleFormula((string) $cell->getValue()) : null;

                if ($google && preg_match('/^TO_PERCENT\((.*)\)$/s', trim($google), $match)) {
                    try {
                        $value = Calculation::getInstance($sheet->getParent())->calculateFormula('='.$match[1], $cell->getCoordinate(), $cell);
                        $cell->setValue(TemplateRows::withCachedValue((string) $cell->getValue(), is_numeric($value) ? round((float) $value, 6) : ''));
                    } catch (\Throwable) {
                        // Left as exported; Google Sheets recalculates it on opening.
                    }
                }
            }
        }
    }

    /** A note or link; a web address in it becomes the cell's link, as in the team's sheet. */
    private function setText(Worksheet $sheet, string $address, ?string $text): void
    {
        $this->setIfInput($sheet, $address, $text);

        if ($text && preg_match('#https?://[^\s]+#i', $text, $match)) {
            $sheet->getCell($address)->getHyperlink()->setUrl($match[0]);
        }
    }

    private function stageTitle(PlanStage $stage): string
    {
        $title = $this->text($stage->name);
        $japanese = trim((string) ($stage->name['ja'] ?? ''));

        // The team's sheet names stages in two languages, e.g. "Basic Design 基本設計".
        return $japanese !== '' && $this->language !== 'ja' && ! str_contains($title, $japanese) ? "{$title} {$japanese}" : $title;
    }

    /** @param  string|array{0: int, 1: int}  $address */
    private function setIfInput(Worksheet $sheet, string|array $address, mixed $value): void
    {
        $cell = $sheet->getCell($address);

        if (! $cell->isFormula()) {
            $cell->setValue($value === '' ? null : $value);
        }
    }

    /** @param  string|array{0: int, 1: int}  $address */
    private function setDate(Worksheet $sheet, string|array $address, ?string $date): void
    {
        $this->setIfInput($sheet, $address, $date ? ExcelDate::PHPToExcel(CarbonImmutable::parse($date)->startOfDay()) : null);
    }

    /** @param  array<string, mixed>|null  $value */
    private function text(?array $value): string
    {
        return trim((string) (($value[$this->language] ?? null) ?: ($value['vi'] ?? null) ?: collect($value ?? [])->filter()->first() ?: ''));
    }

    private function circled(int $number): string
    {
        return $number <= 20 ? mb_chr(0x2460 + $number - 1) : "({$number})";
    }
}
