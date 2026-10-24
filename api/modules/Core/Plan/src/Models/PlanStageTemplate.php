<?php

namespace Origo\Core\Plan\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

/** One stage of the system-wide list that every new project's plan starts from (set by an admin). */
#[Fillable(['key', 'name', 'color', 'position'])]
class PlanStageTemplate extends Model
{
    use HasUlids;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['name' => 'array', 'position' => 'integer'];
    }
}
