<?php

namespace Origo\Core\Plan\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Origo\Core\Plan\Enums\PlanTaskStatus;

/**
 * One feature in one stage: its dates, status and the person doing it, plus the planned effort in man-days,
 * how much of it is finished, a document link and a note. Dates are whole days, inclusive. `status` is the
 * category (todo / doing / done) of `plan_status_id`, the project's own status name.
 */
#[Fillable(['plan_item_id', 'plan_stage_id', 'start_date', 'end_date', 'status', 'plan_status_id', 'assignee_id', 'estimate_days', 'progress', 'link', 'note'])]
class PlanTask extends Model
{
    use HasUlids;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'status' => PlanTaskStatus::class,
            'estimate_days' => 'float',
            'progress' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }
}
