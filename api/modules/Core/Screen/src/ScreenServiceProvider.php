<?php

namespace Origo\Core\Screen;

use Illuminate\Support\ServiceProvider;
use Origo\Core\Project\Models\Project;
use Origo\Core\Screen\Models\Concept;
use Origo\Core\Screen\Models\Screen;
use Origo\Core\Screen\Models\ScreenPoint;

class ScreenServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');

        // Relations are attached from this module so the Project module never depends on Screen.
        Project::resolveRelationUsing('screens', fn (Project $project) => $project->hasMany(Screen::class)->orderBy('position'));
        Project::resolveRelationUsing('points', fn (Project $project) => $project->hasManyThrough(ScreenPoint::class, Screen::class));
        Project::resolveRelationUsing('concepts', fn (Project $project) => $project->hasMany(Concept::class)->orderBy('created_at'));

    }
}
