<?php

namespace Origo\Core\Screen\Actions;

use Illuminate\Support\Facades\DB;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Support\LocalizedText;
use Origo\Core\Screen\Models\Screen;
use Origo\Core\Screen\Support\ScreenImageFactory;
use Origo\Core\Screen\Support\ScreenSource;

class CreateScreen
{
    public function __construct(private readonly ScreenImageFactory $images) {}

    /**
     * @param  array{name: array<string, mixed>, flow?: array<string, mixed>|null, purpose?: array<string, mixed>|null}  $texts
     */
    public function handle(Project $project, array $texts, ScreenSource $source): Screen
    {
        // The image is produced first: a page that cannot be captured must not leave an empty screen behind.
        $image = $this->images->create($source);

        return DB::transaction(fn () => Screen::create([
            ...$image,
            'project_id' => $project->id,
            'code' => $this->nextCode($project),
            'name' => LocalizedText::normalize($texts['name']),
            'flow' => LocalizedText::normalize($texts['flow'] ?? null),
            'purpose' => LocalizedText::normalize($texts['purpose'] ?? null),
            'position' => (int) Screen::query()->where('project_id', $project->id)->max('position') + 1,
        ]));
    }

    /**
     * Codes are never reused, so a deleted SC-03 does not come back as a different screen. The row lock
     * keeps two screens created at the same moment from receiving the same code.
     */
    private function nextCode(Project $project): string
    {
        $sequence = DB::table('screen_code_sequences')->where('project_id', $project->id)->lockForUpdate()->first();

        // Projects created before the sequence existed continue after their highest current code.
        $last = $sequence?->last_number ?? (int) Screen::query()
            ->where('project_id', $project->id)
            ->pluck('code')
            ->map(fn (string $code) => (int) substr($code, 3))
            ->max();

        DB::table('screen_code_sequences')->updateOrInsert(['project_id' => $project->id], ['last_number' => $last + 1]);

        return sprintf('SC-%02d', $last + 1);
    }
}
