<?php

namespace Origo\Core\Plan\Support\Excel;

use App\Models\User;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Reader\Exception as ReaderException;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * The team's project-management workbook that plan exports are filled into. An admin uploads a real,
 * filled file; it is emptied of its project data on the way in (see TemplateCleaner), so only the layout,
 * formulas and formats are kept on the server, never another project's content.
 */
class TemplateStore
{
    private const DISK = 'local';

    private const FILE = 'plan-templates/project-management.xlsx';

    private const META = 'plan-templates/project-management.json';

    /** Reading a large Google Sheets export needs more than PHP's default memory. */
    private const MEMORY_LIMIT = '1024M';

    public function __construct(private readonly TemplateCleaner $cleaner) {}

    public function exists(): bool
    {
        return Storage::disk(self::DISK)->exists(self::FILE) && Storage::disk(self::DISK)->exists(self::META);
    }

    /** @return array<string, mixed>|null */
    public function meta(): ?array
    {
        return $this->exists() ? json_decode((string) Storage::disk(self::DISK)->get(self::META), true) : null;
    }

    public function path(): string
    {
        return Storage::disk(self::DISK)->path(self::FILE);
    }

    /**
     * @return array<string, mixed> the stored description
     */
    public function save(string $uploadedPath, string $originalName, ?string $ganttSheet, User $by): array
    {
        ini_set('memory_limit', self::MEMORY_LIMIT);

        try {
            $candidates = $this->cleaner->ganttCandidates($uploadedPath);
            $result = $this->cleaner->clean($uploadedPath, $ganttSheet);
        } catch (ReaderException $exception) {
            throw new TemplateException('The file is not a readable .xlsx workbook.', previous: $exception);
        }
        $temporary = tempnam(sys_get_temp_dir(), 'plan-template');

        try {
            $writer = new Xlsx($result['book']);
            $writer->setPreCalculateFormulas(false);
            $writer->save($temporary);
            $result['book']->disconnectWorksheets();
            Storage::disk(self::DISK)->put(self::FILE, (string) file_get_contents($temporary));
        } finally {
            @unlink($temporary);
        }

        $meta = [
            'originalName' => mb_substr($originalName, 0, 200),
            'uploadedAt' => now()->toIso8601String(),
            'uploadedBy' => ['id' => $by->id, 'name' => $by->name],
            'ganttSheet' => $result['gantt'],
            'weeklySheet' => $result['weekly'],
            'candidates' => $candidates,
            'warnings' => $result['warnings'],
            'statusStyles' => $result['statusStyles'],
        ];
        Storage::disk(self::DISK)->put(self::META, (string) json_encode($meta, JSON_UNESCAPED_UNICODE));

        return $meta;
    }

    public function delete(): void
    {
        Storage::disk(self::DISK)->delete([self::FILE, self::META]);
    }
}
