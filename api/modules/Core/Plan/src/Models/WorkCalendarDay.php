<?php

namespace Origo\Core\Plan\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** A public holiday or a make-up working day, an exception to the Monday–Friday week. */
#[Fillable(['date', 'kind', 'name'])]
class WorkCalendarDay extends Model
{
    public const HOLIDAY = 'holiday';

    public const WORKDAY = 'workday';

    protected $primaryKey = 'date';

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['date' => 'date:Y-m-d'];
    }
}
