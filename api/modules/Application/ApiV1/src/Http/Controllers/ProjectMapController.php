<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use Illuminate\Support\Facades\Gate;
use Origo\Application\ApiV1\Http\Resources\ProjectMapResource;
use Origo\Core\Project\Models\Project;

class ProjectMapController
{
    public function __invoke(Project $project): ProjectMapResource
    {
        Gate::authorize('view', $project);

        return new ProjectMapResource($project);
    }
}
