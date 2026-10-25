<?php

namespace Origo\Core\Plan\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

/**
 * A delivery stage such as basic design, development or UAT; each project keeps its own ordered list. A stage
 * may carry the window agreed for it and the side responsible (e.g. "VN", "JP" or the customer).
 */
#[Fillable(['project_id', 'key', 'name', 'color', 'position', 'start_date', 'end_date', 'owner'])]
class PlanStage extends Model
{
    use HasUlids;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['name' => 'array', 'position' => 'integer', 'start_date' => 'date', 'end_date' => 'date'];
    }
}
