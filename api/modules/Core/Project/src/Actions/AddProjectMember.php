<?php

namespace Origo\Core\Project\Actions;

use App\Models\User;
use Illuminate\Validation\ValidationException;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Models\ProjectMember;

class AddProjectMember
{
    public function handle(Project $project, User $user, string $role): ProjectMember
    {
        if ($project->members()->where('user_id', $user->id)->exists()) {
            throw ValidationException::withMessages(['userId' => 'This person is already a member of the project.']);
        }

        return $project->members()->create(['user_id' => $user->id, 'role' => $role]);
    }
}
