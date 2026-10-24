<?php

namespace Origo\Core\Project\Actions;

use Origo\Core\Project\Enums\ProjectPermission;
use Origo\Core\Project\Models\ProjectMember;
use Origo\Core\Project\Support\ProjectRoles;

class ChangeProjectMemberRole
{
    public function handle(ProjectMember $member, string $role): ProjectMember
    {
        if (! app(ProjectRoles::class)->find($role)?->allows(ProjectPermission::ManageMembers)) {
            EnsureProjectKeepsManager::excluding($member);
        }

        $member->update(['role' => $role]);

        return $member;
    }
}
