<?php

namespace Origo\Core\Project\Actions;

use Illuminate\Validation\ValidationException;
use Origo\Core\Project\Enums\ProjectPermission;
use Origo\Core\Project\Models\ProjectMember;
use Origo\Core\Project\Support\ProjectRoles;

/**
 * A project always keeps at least one member whose role can manage members, otherwise nobody but an
 * admin could add people or change roles again.
 */
final class EnsureProjectKeepsManager
{
    /** Called before the member loses that ability (a role change or removal). */
    public static function excluding(ProjectMember $member): void
    {
        $managerRoles = app(ProjectRoles::class)->keysWith(ProjectPermission::ManageMembers);

        if (! in_array($member->role, $managerRoles, true)) {
            return;
        }

        $others = ProjectMember::query()
            ->where('project_id', $member->project_id)
            ->whereIn('role', $managerRoles)
            ->whereKeyNot($member->getKey())
            ->exists();

        if (! $others) {
            throw ValidationException::withMessages(['role' => 'The project needs at least one member who can manage members.']);
        }
    }
}
