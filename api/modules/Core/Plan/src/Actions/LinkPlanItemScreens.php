<?php

namespace Origo\Core\Plan\Actions;

use Origo\Core\Plan\Models\PlanItem;
use Origo\Core\Screen\Models\Screen;

/** Sets which design screens describe a feature; screens of other projects are ignored. */
class LinkPlanItemScreens
{
    /**
     * @param  array<int, string>  $screenCodes
     */
    public function handle(PlanItem $feature, array $screenCodes): void
    {
        $screenIds = Screen::query()->where('project_id', $feature->project_id)->whereIn('code', $screenCodes)->pluck('id');

        $feature->screens()->sync($screenIds);
    }
}
