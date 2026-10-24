<?php

namespace Origo\Core\Project\Actions;

use Origo\Core\Project\Models\Project;

class DeleteProject
{
    public function handle(Project $project): void
    {
        $project->delete();
    }
}
