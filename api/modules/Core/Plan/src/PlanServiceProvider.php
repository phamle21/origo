<?php

namespace Origo\Core\Plan;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Origo\Core\Plan\Listeners\ClearRemovedAssignee;
use Origo\Core\Plan\Models\PlanItem;
use Origo\Core\Plan\Models\PlanStage;
use Origo\Core\Project\Events\ProjectMemberRemoved;
use Origo\Core\Project\Models\Project;
use Origo\Core\Screen\Models\Screen;

class PlanServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');

        Event::listen(ProjectMemberRemoved::class, ClearRemovedAssignee::class);

        // Attached from here so neither the Project nor the Screen module depends on planning.
        Project::resolveRelationUsing('planStages', fn (Project $project) => $project->hasMany(PlanStage::class)->orderBy('position'));
        Project::resolveRelationUsing('planItems', fn (Project $project) => $project->hasMany(PlanItem::class)->orderBy('position'));
        Screen::resolveRelationUsing('planItems', fn (Screen $screen) => $screen->belongsToMany(PlanItem::class, 'plan_item_screen'));
    }
}
