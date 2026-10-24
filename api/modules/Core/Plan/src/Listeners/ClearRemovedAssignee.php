<?php

namespace Origo\Core\Plan\Listeners;

use Origo\Core\Plan\Models\PlanItem;
use Origo\Core\Plan\Models\PlanTask;
use Origo\Core\Project\Events\ProjectMemberRemoved;

/** A person who left a project no longer owns its tasks; the dates and status stay. */
class ClearRemovedAssignee
{
    public function handle(ProjectMemberRemoved $event): void
    {
        PlanTask::query()
            ->where('assignee_id', $event->userId)
            ->whereIn('plan_item_id', PlanItem::query()->where('project_id', $event->projectId)->select('id'))
            ->update(['assignee_id' => null]);
    }
}
