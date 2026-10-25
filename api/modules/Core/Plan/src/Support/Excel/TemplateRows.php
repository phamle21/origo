<?php

namespace Origo\Core\Plan\Support\Excel;

use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\ReferenceHelper;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * One template row held in memory: each cell's style, its formula (if any) and the row's height and merged
 * ranges, so the row can be laid down again anywhere, exactly as the template has it.
 */
final class TemplateRows
{
    /**
     * @param  array<int, array{xf: int, formula: string|null}>  $cells  by column number
     * @param  list<array{0: int, 1: int}>  $merges  column ranges merged within the row
     */
    private function __construct(public readonly int $row, public readonly array $cells, public readonly float $height, public readonly array $merges) {}

    public static function capture(Worksheet $sheet, int $row, int $lastColumn): self
    {
        $cells = [];

        for ($column = 1; $column <= $lastColumn; $column++) {
            $cell = $sheet->getCell([$column, $row]);
            $cells[$column] = ['xf' => $cell->getXfIndex(), 'formula' => $cell->isFormula() ? (string) $cell->getValue() : null];
        }

        $merges = [];
        foreach ($sheet->getMergeCells() as $range) {
            [[$fromColumn, $fromRow], [$toColumn, $toRow]] = array_map(fn ($ref) => Coordinate::coordinateFromString($ref), explode(':', $range));

            if ((int) $fromRow === $row && (int) $toRow === $row) {
                $merges[] = [Coordinate::columnIndexFromString($fromColumn), Coordinate::columnIndexFromString($toColumn)];
            }
        }

        return new self($row, $cells, (float) $sheet->getRowDimension($row)->getRowHeight(), $merges);
    }

    /**
     * Lays this row down at $target: styles, formulas moved to the new row, no values, the same merges.
     * $cached may give the cached result of a Google Sheets formula exported as IFERROR(…, "cached").
     *
     * @param  (callable(int $column): (string|null))|null  $cached
     */
    public function apply(Worksheet $sheet, int $target, ?callable $cached = null): void
    {
        foreach ($this->cells as $column => $cell) {
            $address = Coordinate::stringFromColumnIndex($column).$target;
            $sheet->getCell($address)->setValueExplicit(null, DataType::TYPE_NULL);
            $sheet->getCell($address)->setXfIndex($cell['xf']);

            if ($cell['formula'] !== null) {
                $formula = self::moveFormula($cell['formula'], $target - $this->row);
                $value = $cached ? $cached($column) : null;
                $sheet->getCell($address)->setValue($value === null ? $formula : self::withCachedValue($formula, $value));
            }
        }

        $sheet->getRowDimension($target)->setRowHeight($this->height);

        foreach ($this->merges as [$from, $to]) {
            $sheet->mergeCells([$from, $target, $to, $target]);
        }
    }

    public static function moveFormula(string $formula, int $rows): string
    {
        return $rows === 0 ? $formula : ReferenceHelper::getInstance()->updateFormulaReferences($formula, 'A1', 0, $rows);
    }

    /** Google Sheets exports formulas Excel lacks as IFERROR(__xludf.DUMMYFUNCTION(…), cached); this sets the cached part. */
    public static function withCachedValue(string $formula, string|int|float $value): string
    {
        if (! str_contains($formula, '__xludf.DUMMYFUNCTION')) {
            return $formula;
        }

        $literal = is_string($value) ? '"'.str_replace('"', '""', $value).'"' : (string) $value;

        return preg_replace_callback('/,\s*("(?:[^"]|"")*"|[^,()"]*)\)\s*$/u', fn () => ','.$literal.')', $formula) ?? $formula;
    }

    /** The Google Sheets formula kept inside IFERROR(__xludf.DUMMYFUNCTION("…"), cached), or null. */
    public static function googleFormula(string $formula): ?string
    {
        return preg_match('/__xludf\.DUMMYFUNCTION\("((?:[^"]|"")*)"\)/su', $formula, $match) ? str_replace('""', '"', $match[1]) : null;
    }
}
