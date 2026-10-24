<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

/**
 * One entry of the permission catalog: a key code checks (fixed) with the name, description, group
 * and order admins see. `scope` is "system" (system roles) or "project" (project roles).
 */
#[Fillable(['scope', 'key', 'group', 'name', 'description', 'position'])]
class Permission extends Model
{
    use HasUlids;

    /** The groups each scope sorts its permissions into. */
    public const GROUPS = [
        'system' => ['people', 'system', 'projects'],
        'project' => ['reading', 'plan', 'design', 'team'],
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['name' => 'array', 'description' => 'array', 'position' => 'integer'];
    }
}
