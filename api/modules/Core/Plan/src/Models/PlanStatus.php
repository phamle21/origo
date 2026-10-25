<?php

namespace Origo\Core\Plan\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Origo\Core\Plan\Enums\PlanTaskStatus;

/** A task status a project names itself (e.g. "Checking"); its category decides colours and progress. */
#[Fillable(['project_id', 'name', 'category', 'color', 'position'])]
class PlanStatus extends Model
{
    use HasUlids;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['name' => 'array', 'category' => PlanTaskStatus::class, 'position' => 'integer'];
    }
}
