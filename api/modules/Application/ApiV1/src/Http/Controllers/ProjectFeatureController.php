<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use Illuminate\Support\Facades\Gate;
use Laravel\Pennant\Feature;
use Origo\Core\Project\Models\Project;

// Feature flags (Laravel Pennant) resolved for one project, so the web app can show or hide modules.
class ProjectFeatureController
{
    /**
     * @return array{data: array<string, mixed>}
     */
    public function __invoke(Project $project): array
    {
        Gate::authorize('view', $project);

        return ['data' => Feature::for($project)->all()];
    }
}
