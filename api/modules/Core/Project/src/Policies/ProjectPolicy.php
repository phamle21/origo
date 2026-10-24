<?php

namespace Origo\Core\Project\Policies;

use App\Enums\SystemPermission;
use App\Models\User;
use Origo\Core\Project\Enums\ProjectPermission;
use Origo\Core\Project\Models\Project;

/**
 * Two layers: a system permission can grant rights in every project ("manage all projects" means
 * everything, "view all" means reading), and otherwise the person's role in this project decides
 * (a ProjectRole, whose permissions admins tick in the settings).
 */
class ProjectPolicy
{
    /** What changes a project. An archived project refuses all of it, whoever asks. */
    private const CHANGES = ['update', 'editDesign', 'editPlan', 'manageMembers'];

    public function before(User $user, string $ability, mixed $project = null): ?bool
    {
        if ($project instanceof Project && $project->isArchived() && in_array($ability, self::CHANGES, true)) {
            return false;
        }

        return $user->hasPermission(SystemPermission::ManageAllProjects) ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Project $project): bool
    {
        return $user->hasPermission(SystemPermission::ViewAllProjects) || $project->allows($user, ProjectPermission::Read);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(SystemPermission::CreateProjects);
    }

    public function update(User $user, Project $project): bool
    {
        return $project->allows($user, ProjectPermission::EditProject);
    }

    /** Archiving (and bringing back) is for whoever may edit the project's details. */
    public function archive(User $user, Project $project): bool
    {
        return $project->allows($user, ProjectPermission::EditProject);
    }

    /** Deleting for good is only for people who manage every project (checked in before()). */
    public function delete(User $user, Project $project): bool
    {
        return false;
    }

    public function editDesign(User $user, Project $project): bool
    {
        return $project->allows($user, ProjectPermission::EditDesign);
    }

    public function editPlan(User $user, Project $project): bool
    {
        return $project->allows($user, ProjectPermission::EditPlan);
    }

    public function manageMembers(User $user, Project $project): bool
    {
        return $project->allows($user, ProjectPermission::ManageMembers);
    }
}
