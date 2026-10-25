<?php

namespace Origo\Core\Plan\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

/** One week of a project's weekly report: frozen progress figures and the written summary. */
#[Fillable(['project_id', 'week_start', 'snapshot', 'snapshot_at', 'summary'])]
class PlanWeeklyReport extends Model
{
    use HasUlids;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['week_start' => 'date', 'snapshot' => 'array', 'snapshot_at' => 'datetime', 'summary' => 'array'];
    }
}
