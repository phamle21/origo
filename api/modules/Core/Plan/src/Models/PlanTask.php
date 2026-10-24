<?php

namespace Origo\Core\Plan\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Origo\Core\Plan\Enums\PlanTaskStatus;

/** One feature in one stage: its dates, status and the person doing it. Dates are whole days, inclusive. */
#[Fillable(['plan_item_id', 'plan_stage_id', 'start_date', 'end_date', 'status', 'assignee_id'])]
class PlanTask extends Model
{
    use HasUlids;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['start_date' => 'date', 'end_date' => 'date', 'status' => PlanTaskStatus::class];
    }
}
