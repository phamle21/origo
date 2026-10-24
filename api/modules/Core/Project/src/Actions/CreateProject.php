<?php

namespace Origo\Core\Project\Actions;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Support\ProjectRoles;

class CreateProject
{
    /**
     * The chosen manager (or the creator when none is chosen) becomes the first member, holding the role
     * that can manage the project (see ProjectRoles::ownerRole).
     *
     * @param  array{code: string, name: array{vi: string, ja: string|null}, description?: array{vi: string|null, ja: string|null}|null}  $data
     */
    public function handle(User $owner, array $data, ?User $manager = null): Project
    {
        $ownerRole = app(ProjectRoles::class)->ownerRole()
            ?? throw ValidationException::withMessages(['managerId' => 'Create a project role that can manage members first.']);

        return DB::transaction(function () use ($owner, $data, $manager, $ownerRole) {
            $project = Project::create([...$data, 'owner_id' => $owner->id]);
            $project->members()->create(['user_id' => ($manager ?? $owner)->id, 'role' => $ownerRole->key]);

            return $project;
        });
    }
}
