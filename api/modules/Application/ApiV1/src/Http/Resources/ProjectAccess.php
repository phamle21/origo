<?php

namespace Origo\Application\ApiV1\Http\Resources;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Origo\Core\Project\Models\Project;

/** What the signed-in person may do in a project, so the web app shows only the actions that will work. */
final class ProjectAccess
{
    /**
     * @return array{myRole: string|null, permissions: array{canEditDesign: bool, canEditPlan: bool, canManageMembers: bool}}
     */
    public static function for(Project $project, User $user): array
    {
        return [
            'myRole' => $project->roleOf($user)?->key,
            'archivedAt' => $project->archived_at?->toIso8601ZuluString(),
            'permissions' => [
                'canEditDesign' => Gate::forUser($user)->allows('editDesign', $project),
                'canEditPlan' => Gate::forUser($user)->allows('editPlan', $project),
                'canManageMembers' => Gate::forUser($user)->allows('manageMembers', $project),
                'canEditProject' => Gate::forUser($user)->allows('update', $project),
                'canArchive' => Gate::forUser($user)->allows('archive', $project),
                'canDelete' => Gate::forUser($user)->allows('delete', $project),
            ],
        ];
    }
}
