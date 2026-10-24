<?php

namespace Origo\Core\Screen\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

/** A business concept shared by points, e.g. the course price; points sharing one affect each other. */
#[Fillable(['project_id', 'key', 'name', 'description', 'also_used_in'])]
class Concept extends Model
{
    use HasUlids;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'name' => 'array',
            'description' => 'array',
            'also_used_in' => 'array',
        ];
    }
}
