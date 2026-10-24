<?php

namespace Origo\Core\Project\Actions;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Origo\Core\Project\Models\Project;
use Origo\Core\Screen\Actions\DeleteScreen;
use Origo\Core\Screen\Models\Screen;

/**
 * Removes a project and everything in it for good: members, plan, screens with their pictures and
 * captured sources, comments, and the notifications that point at it. The caller must type the
 * project code, so a wrong click can never do it.
 */
class DeleteProjectForever
{
    public function __construct(private readonly DeleteScreen $deleteScreen) {}

    public function handle(Project $project, string $typedCode): void
    {
        if (trim($typedCode) !== $project->code) {
            throw ValidationException::withMessages(['confirmCode' => 'Type the project code exactly to delete it.']);
        }

        // Screens go one by one so their image files are removed too.
        Screen::query()->where('project_id', $project->id)->get()->each(fn (Screen $screen) => $this->deleteScreen->handle($screen));

        DB::transaction(function () use ($project) {
            // Codes are plain ASCII, so the stored JSON holds them as written.
            DB::table('notifications')->where('data', 'like', '%"project":{"code":"'.$project->code.'"%')->delete();
            $project->forceDelete();
        });
    }
}
