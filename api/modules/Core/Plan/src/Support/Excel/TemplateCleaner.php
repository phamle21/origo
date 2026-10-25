<?php

namespace Origo\Core\Plan\Support\Excel;

use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\IReadFilter;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Turns a filled project-management workbook into an empty template: keeps the Gantt sheet, the Weekly
 * Report and .setting with every formula, format, drop-down and conditional format, and removes the
 * project's own data — typed values, links, comments, cached results — plus every other sheet. The data
 * rows shrink to one row of each kind (first phase, module, feature, later phase) for the filler to copy.
 */
class TemplateCleaner
{
    /**
     * Sheets that could hold the Gantt chart, the preferred one first: copies, old and dated versions last.
     *
     * @return list<string>
     */
    public function ganttCandidates(string $path): array
    {
        $names = array_values(array_filter(IOFactory::createReader('Xlsx')->listWorksheetNames($path), fn (string $name) => $this->sheetLooks($path, $name, [TemplateLayout::class, 'isGanttSheet'])));
        usort($names, fn (string $left, string $right) => $this->doubtfulness($left) <=> $this->doubtfulness($right));

        return $names;
    }

    /** @var array<int, array<string, array<string, mixed>>> */
    private array $statusStyles = [];

    /**
     * @return array{book: Spreadsheet, gantt: string, weekly: string|null, warnings: list<string>, statusStyles: array<int, array<string, array<string, mixed>>>}
     */
    public function clean(string $path, ?string $ganttSheet = null): array
    {
        $names = IOFactory::createReader('Xlsx')->listWorksheetNames($path);
        $candidates = $this->ganttCandidates($path);
        $gantt = $ganttSheet ?? ($candidates[0] ?? null);

        if (! $gantt || ! in_array($gantt, $candidates, true)) {
            throw new TemplateException('No sheet has the Gantt layout (PAGE TITLE in D9, VOLUME in H9).');
        }
        if (! in_array(TemplateLayout::SETTING_SHEET, $names, true) || ! $this->sheetLooks($path, TemplateLayout::SETTING_SHEET, [TemplateLayout::class, 'isSettingSheet'])) {
            throw new TemplateException('The workbook needs its .setting sheet (Status, P.I.C, Holiday).');
        }

        $weekly = in_array(TemplateLayout::WEEKLY_SHEET, $names, true) ? TemplateLayout::WEEKLY_SHEET : null;
        $reader = IOFactory::createReader('Xlsx');
        $reader->setLoadSheetsOnly(array_values(array_filter([$gantt, $weekly, TemplateLayout::SETTING_SHEET])));
        $book = $reader->load($path);
        $warnings = [];

        $this->cleanGantt($book->getSheetByNameOrThrow($gantt));

        if ($weekly && TemplateLayout::isWeeklySheet($book->getSheetByNameOrThrow($weekly))) {
            $this->cleanWeekly($book->getSheetByNameOrThrow($weekly));
        } elseif ($weekly) {
            $warnings[] = 'The Weekly Report sheet does not follow the expected layout and is left as it is.';
        } else {
            $warnings[] = 'The workbook has no Weekly Report sheet.';
        }

        $this->cleanSetting($book->getSheetByNameOrThrow(TemplateLayout::SETTING_SHEET));

        foreach ($book->getWorksheetIterator() as $sheet) {
            foreach (array_keys($sheet->getComments()) as $address) {
                $sheet->removeComment($address);
            }
        }
        $book->setActiveSheetIndex($book->getIndex($book->getSheetByNameOrThrow($gantt)));

        return ['book' => $book, 'gantt' => $gantt, 'weekly' => $weekly, 'warnings' => $warnings, 'statusStyles' => $this->statusStyles];
    }

    private function cleanGantt(Worksheet $sheet): void
    {
        $lastColumn = TemplateLayout::chartLastColumn($sheet);
        $lastRow = $sheet->getHighestRow();
        $kinds = [];

        for ($row = TemplateLayout::FIRST_DATA_ROW; $row <= $lastRow; $row++) {
            $kinds[$row] = match (true) {
                str_starts_with(strtolower(trim((string) $sheet->getCell("B{$row}")->getValue())), 'phase') => 'phase',
                trim((string) $sheet->getCell("C{$row}")->getValue()) !== '' => 'module',
                trim((string) $sheet->getCell("D{$row}")->getValue()).trim((string) $sheet->getCell("E{$row}")->getValue()) !== '' => 'feature',
                default => null,
            };
        }

        if (($kinds[TemplateLayout::FIRST_DATA_ROW] ?? null) !== 'phase') {
            throw new TemplateException('Row 10 of the Gantt sheet must be the first phase.');
        }

        $prototypes = [
            'module' => $this->typicalRow($sheet, $kinds, 'module') ?? throw new TemplateException('The Gantt sheet has no module row (a name in column C).'),
            'feature' => $this->typicalRow($sheet, $kinds, 'feature') ?? throw new TemplateException('The Gantt sheet has no feature row (a name in column D).'),
        ];
        $prototypes['phase'] = $this->typicalRow($sheet, $kinds, 'phase', TemplateLayout::FIRST_DATA_ROW) ?? $prototypes['module'];
        $this->statusStyles = $this->statusStyles($sheet, $kinds);
        $captured = array_map(fn (int $row) => TemplateRows::capture($sheet, $row, $lastColumn), $prototypes);

        // Keep rows 10–13 so ranges (formats, drop-downs) still span the data area, then lay the kinds down.
        $keep = TemplateLayout::PROTOTYPE_ROWS['phase'];
        if ($lastRow > $keep) {
            $sheet->removeRow($keep + 1, $lastRow - $keep);
        }
        foreach ($sheet->getMergeCells() as $range) {
            $rows = array_map(fn ($ref) => (int) Coordinate::coordinateFromString($ref)[1], explode(':', $range));
            if (min($rows) > TemplateLayout::FIRST_DATA_ROW) {
                $sheet->unmergeCells($range);
            }
        }
        foreach (['module', 'feature', 'phase'] as $kind) {
            $captured[$kind]->apply($sheet, TemplateLayout::PROTOTYPE_ROWS[$kind], fn () => '');
        }
        $this->clampRanges($sheet, $keep);

        // The first phase row keeps its own formulas (the weekday letters of the chart); only values go.
        $this->clearValues($sheet, TemplateLayout::FIRST_DATA_ROW, TemplateLayout::FIRST_DATA_ROW, 1, TemplateLayout::LAST_BLOCK_COLUMN);

        foreach (array_keys($sheet->getHyperlinkCollection()) as $address) {
            $sheet->getCell($address)->setHyperlink(null);
        }

        $sheet->getCell(TemplateLayout::TITLE_CELL)->setValue(null);
        $sheet->getCell(TemplateLayout::PHASE_LABEL_CELL)->setValue(null);
        for ($block = 0; $block < TemplateLayout::BLOCK_COUNT; $block++) {
            $this->clearIfValue($sheet, Coordinate::stringFromColumnIndex(TemplateLayout::BLOCK_START_COLUMN + $block * TemplateLayout::BLOCK_WIDTH).'1');
            foreach (array_filter(TemplateLayout::WINDOW_CELLS[$block]) as $address) {
                $this->clearIfValue($sheet, $address);
            }
        }
    }

    /**
     * The row of a kind whose cell styles most rows of that kind share, so a one-off look (a highlighted
     * row, a wrapped note) does not become every row's look.
     *
     * @param  array<int, string|null>  $kinds
     */
    private function typicalRow(Worksheet $sheet, array $kinds, string $kind, int $after = 0): ?int
    {
        $signatures = [];

        foreach ($kinds as $row => $found) {
            if ($found === $kind && $row > $after) {
                $signature = '';
                for ($column = 1; $column <= TemplateLayout::LAST_BLOCK_COLUMN; $column++) {
                    $signature .= $sheet->getCell([$column, $row])->getXfIndex().',';
                }
                $signatures[$signature][] = $row;
            }
        }

        if (! $signatures) {
            return null;
        }
        uasort($signatures, fn (array $left, array $right) => count($right) <=> count($left));

        return reset($signatures)[0];
    }

    /**
     * Google Sheets exports coloured drop-down "chips" as plain fills, so each status word has its own
     * look in each stage block; the most common look of each word per block is kept for the filler.
     *
     * @param  array<int, string|null>  $kinds
     * @return array<int, array<string, array<string, mixed>>> block → status text → style
     */
    private function statusStyles(Worksheet $sheet, array $kinds): array
    {
        $counts = [];

        foreach (array_keys(array_filter($kinds, fn ($kind) => $kind === 'feature')) as $row) {
            for ($block = 0; $block < TemplateLayout::BLOCK_COUNT; $block++) {
                $cell = $sheet->getCell([TemplateLayout::BLOCK_START_COLUMN + $block * TemplateLayout::BLOCK_WIDTH + 4, $row]);
                $label = trim((string) $cell->getValue());
                if ($label !== '' && ! $cell->isFormula()) {
                    $style = $sheet->getStyle($cell->getCoordinate())->exportArray();
                    $key = md5(json_encode($style));
                    $counts[$block][$label][$key] = ['style' => $style, 'count' => ($counts[$block][$label][$key]['count'] ?? 0) + 1];
                }
            }
        }

        return array_map(fn (array $labels) => array_map(function (array $styles) {
            uasort($styles, fn (array $left, array $right) => $right['count'] <=> $left['count']);

            return reset($styles)['style'];
        }, $labels), $counts);
    }

    /**
     * Conditional formats and drop-downs that reached below the removed rows end at the last kept row, so
     * the filler's inserted rows grow them to exactly the plan's length.
     */
    private function clampRanges(Worksheet $sheet, int $lastRow): void
    {
        $clamp = function (string $ranges, string $separator) use ($lastRow): string {
            $kept = [];
            foreach (preg_split('/[\s,]+/', trim($ranges)) as $range) {
                $parts = explode(':', $range);
                [$fromColumn, $fromRow] = Coordinate::coordinateFromString($parts[0]);
                [$toColumn, $toRow] = Coordinate::coordinateFromString($parts[1] ?? $parts[0]);
                if ((int) $fromRow > $lastRow) {
                    continue;
                }
                $kept[] = $fromColumn.$fromRow.':'.$toColumn.min((int) $toRow, $lastRow);
            }

            return implode($separator, $kept);
        };

        foreach ($sheet->getConditionalStylesCollection() as $range => $styles) {
            $sheet->removeConditionalStyles($range);
            // Conditional formats list their ranges with commas, drop-downs with spaces.
            if (($clamped = $clamp($range, ',')) !== '') {
                $sheet->setConditionalStyles($clamped, $styles);
            }
        }

        foreach ($sheet->getDataValidationCollection() as $range => $validation) {
            $sheet->setDataValidation($range, null);
            if (($clamped = $clamp($range, ' ')) !== '') {
                $validation->setSqref($clamped);
                $sheet->setDataValidation($clamped, $validation);
            }
        }
    }

    private function cleanWeekly(Worksheet $sheet): void
    {
        $lastWeek = TemplateLayout::lastWeekColumn($sheet);
        $first = TemplateLayout::WEEK_FIRST_COLUMN;

        $this->clearIfValue($sheet, 'C3');
        $this->clearIfValue($sheet, 'E4');
        $this->clearValues($sheet, 2, 2, $first, $lastWeek);

        // Member rows: names, IDs and hours go; the numbers in column A stay.
        $members = $this->rowsAfter($sheet, (int) TemplateLayout::findRow($sheet, 'A', fn ($text) => $text === 'No.'));
        foreach ($members as $row) {
            $this->clearValues($sheet, $row, $row, 2, 3);
            $this->clearValues($sheet, $row, $row, $first, $lastWeek);
        }

        // Each phase section: volumes and weekly figures go, stage labels stay.
        $summaryRow = (int) TemplateLayout::findRow($sheet, 'A', fn ($text) => $text === 'Weekly Summary');
        for ($row = 1; $row < $summaryRow; $row++) {
            if (preg_match('/^Phase\s*\d+/i', trim((string) $sheet->getCell("A{$row}")->getValue()))) {
                for ($inner = $row + 1; $inner < $summaryRow && ! preg_match('/^Phase\s*\d+/i', trim((string) $sheet->getCell("A{$inner}")->getValue())); $inner++) {
                    $this->clearValues($sheet, $inner, $inner, 4, 4);
                    $this->clearValues($sheet, $inner, $inner, $first, $lastWeek);
                }
            }
        }

        // The summary row is typed; the one below it translates it and only its cached result goes.
        $this->clearValues($sheet, $summaryRow + 1, $summaryRow + 1, $first, $lastWeek);
        for ($column = $first; $column <= $lastWeek; $column++) {
            $cell = $sheet->getCell([$column, $summaryRow + 2]);
            if ($cell->isFormula()) {
                $cell->setValue(TemplateRows::withCachedValue((string) $cell->getValue(), ''));
            }
        }
    }

    private function cleanSetting(Worksheet $sheet): void
    {
        foreach ([TemplateLayout::PIC_RANGE, TemplateLayout::HOLIDAY_RANGE, TemplateLayout::WORKDAY_RANGE] as [$column, $from, $to]) {
            $index = Coordinate::columnIndexFromString($column);
            $this->clearValues($sheet, $from, $to, $index, $column === 'C' ? $index : $index + 1);
        }
    }

    /** @return list<int> rows right below $header while column A holds a number */
    private function rowsAfter(Worksheet $sheet, int $header): array
    {
        $rows = [];

        for ($row = $header + 1; is_numeric($sheet->getCell("A{$row}")->getValue()); $row++) {
            $rows[] = $row;
        }

        return $rows;
    }

    private function clearValues(Worksheet $sheet, int $fromRow, int $toRow, int $fromColumn, int $toColumn): void
    {
        for ($row = $fromRow; $row <= $toRow; $row++) {
            for ($column = $fromColumn; $column <= $toColumn; $column++) {
                $this->clearIfValue($sheet, Coordinate::stringFromColumnIndex($column).$row);
            }
        }
    }

    private function clearIfValue(Worksheet $sheet, string $address): void
    {
        $cell = $sheet->getCell($address);

        if (! $cell->isFormula() && $cell->getValue() !== null) {
            $cell->setValue(null);
        }
    }

    private function sheetLooks(string $path, string $name, callable $test): bool
    {
        $reader = IOFactory::createReader('Xlsx');
        $reader->setLoadSheetsOnly([$name]);
        $reader->setReadFilter(new class implements IReadFilter
        {
            public function readCell(string $columnAddress, int $row, string $worksheetName = ''): bool
            {
                return $row <= 9 && Coordinate::columnIndexFromString($columnAddress) <= 8;
            }
        });
        $sheet = $reader->load($path)->getSheetByName($name);

        return $sheet !== null && $test($sheet);
    }

    private function doubtfulness(string $name): int
    {
        return (preg_match('/\b(copy|old|bak|backup|v\d+)\b/i', $name) ? 2 : 0) + (preg_match('/\d{1,2}[-\/.]\d{1,2}|\s\d+$/', $name) ? 1 : 0);
    }
}
