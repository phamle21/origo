<?php

namespace Origo\Core\Plan\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

/** Hours one member worked on one project in one week (keyed by its Monday). */
#[Fillable(['project_id', 'user_id', 'week_start', 'hours'])]
class PlanTimesheetEntry extends Model
{
    use HasUlids;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['week_start' => 'date', 'hours' => 'float'];
    }
}
