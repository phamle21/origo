<?php

namespace Origo\Core\Project\Events;

use Illuminate\Foundation\Events\Dispatchable;

/** Someone left a project; other modules drop what still points at them inside it. */
class ProjectMemberRemoved
{
    use Dispatchable;

    public function __construct(public readonly string $projectId, public readonly int $userId) {}
}
