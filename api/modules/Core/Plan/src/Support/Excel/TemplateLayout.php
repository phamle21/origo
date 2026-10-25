<?php

namespace Origo\Core\Plan\Support\Excel;

use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Where things sit in the team's project-management workbook (a Google Sheets export): the cells people
 * type into, as opposed to the formulas, conditional formats and drop-downs that must stay untouched.
 *
 * Gantt sheet: title B1; per stage an 8-column block from H (volume, start, end, P.I.C, status, %, link,
 * note) titled in row 1, its window and owner in rows 3–7; headers in row 9; data from row 10 (phase rows,
 * module rows, feature rows); the day chart from BM, dated from L3. Weekly Report: start C3, current week
 * E4, recorded dates in row 2, member hours under "No.", stage progress under "Phase 01", summaries under
 * "Weekly Summary". .setting: statuses in A, P.I.C in C, holidays in E/F, make-up days in G/H.
 */
class TemplateLayout
{
    public const HEADER_ROW = 9;

    public const FIRST_DATA_ROW = 10;

    /** After cleaning, the template keeps one row of each kind, in this order. */
    public const PROTOTYPE_ROWS = ['firstPhase' => 10, 'module' => 11, 'feature' => 12, 'phase' => 13];

    public const BLOCK_START_COLUMN = 8; // H

    public const BLOCK_WIDTH = 8;

    public const BLOCK_COUNT = 7;

    public const LAST_BLOCK_COLUMN = 63; // BK

    public const CHART_FIRST_COLUMN = 65; // BM

    /** Window cells of each stage block: owner, start, end (rows 3–7 form a staircase). */
    public const WINDOW_CELLS = [
        ['K3', 'L3', 'O3'],
        ['N4', 'O4', 'W4'],
        ['V5', 'W5', 'AE5'],
        ['AD6', 'AE6', 'AM6'],
        ['AL6', 'AM6', 'AU6'],
        ['AT7', 'AU7', 'BC7'],
        [null, 'BC7', 'BK7'],
    ];

    public const CHART_START_CELL = 'L3';

    public const TITLE_CELL = 'B1';

    public const PHASE_LABEL_CELL = 'E3';

    public const WEEK_FIRST_COLUMN = 6; // F

    public const SETTING_SHEET = '.setting';

    public const WEEKLY_SHEET = 'Weekly Report';

    public const STATUS_COLUMN = 'A';

    public const PIC_RANGE = ['C', 2, 30];

    public const HOLIDAY_RANGE = ['E', 2, 25];

    public const WORKDAY_RANGE = ['G', 2, 25];

    /** A sheet laid out as the Gantt chart: "PAGE TITLE" in D9 and the first stage block from H9. */
    public static function isGanttSheet(Worksheet $sheet): bool
    {
        return str_starts_with(strtoupper(trim((string) $sheet->getCell('D9')->getValue())), 'PAGE TITLE')
            && str_starts_with(strtoupper(trim((string) $sheet->getCell('H9')->getValue())), 'VOLUME');
    }

    public static function isSettingSheet(Worksheet $sheet): bool
    {
        return trim((string) $sheet->getCell('A1')->getValue()) === 'Status' && trim((string) $sheet->getCell('C1')->getValue()) === 'P.I.C';
    }

    public static function isWeeklySheet(Worksheet $sheet): bool
    {
        return self::findRow($sheet, 'A', fn (string $text) => $text === 'No.') !== null
            && self::findRow($sheet, 'A', fn (string $text) => $text === 'Weekly Summary') !== null;
    }

    /** First row (from the top) whose cell in $column satisfies $match, looking at plain values only. */
    public static function findRow(Worksheet $sheet, string $column, callable $match, int $from = 1, ?int $to = null): ?int
    {
        $to ??= min($sheet->getHighestDataRow($column), 2000);

        for ($row = $from; $row <= $to; $row++) {
            $cell = $sheet->getCell($column.$row);

            if (! $cell->isFormula() && $match(trim((string) $cell->getValue()))) {
                return $row;
            }
        }

        return null;
    }

    /** Last week column of the Weekly Report: the last filled cell of the week-number row (row 4). */
    public static function lastWeekColumn(Worksheet $weekly): int
    {
        return Coordinate::columnIndexFromString($weekly->getHighestDataColumn('4'));
    }

    public static function chartLastColumn(Worksheet $gantt): int
    {
        return Coordinate::columnIndexFromString($gantt->getHighestDataColumn((string) self::HEADER_ROW));
    }

    public static function ganttSheet(Spreadsheet $book): Worksheet
    {
        foreach ($book->getWorksheetIterator() as $sheet) {
            if (self::isGanttSheet($sheet)) {
                return $sheet;
            }
        }

        throw new TemplateException('The template has no Gantt sheet.');
    }
}
