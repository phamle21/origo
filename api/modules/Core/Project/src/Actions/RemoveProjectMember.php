<?php

namespace Origo\Core\Project\Actions;

use Origo\Core\Project\Events\ProjectMemberRemoved;
use Origo\Core\Project\Models\ProjectMember;

class RemoveProjectMember
{
    public function handle(ProjectMember $member): void
    {
        EnsureProjectKeepsManager::excluding($member);

        $member->delete();

        ProjectMemberRemoved::dispatch($member->project_id, $member->user_id);
    }
}
