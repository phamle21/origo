<?php

namespace Origo\Core\Project;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Models\ProjectMember;
use Origo\Core\Project\Policies\ProjectPolicy;
use Origo\Core\Project\Support\ContentLanguages;
use Origo\Core\Project\Support\ProjectRoles;

class ProjectServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->scoped(ProjectRoles::class);
        $this->app->scoped(ContentLanguages::class);
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');

        Gate::policy(Project::class, ProjectPolicy::class);

        // The user model lives in the app; the project module adds the side of the relation it owns.
        User::resolveRelationUsing('projectMemberships', fn (User $user) => $user->hasMany(ProjectMember::class));
    }
}
