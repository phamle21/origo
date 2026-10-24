<?php

namespace Origo\Core\Project\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Origo\Core\Project\Enums\ProjectPermission;

/**
 * A role people can hold in a project, such as "BA" or a custom "Tech lead": a name plus the project
 * permissions ticked for it. Members point at it by its key, which never changes after creation.
 */
#[Fillable(['key', 'name', 'description', 'permissions', 'position'])]
class ProjectRole extends Model
{
    use HasUlids;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['name' => 'array', 'description' => 'array', 'permissions' => 'array', 'position' => 'integer'];
    }

    /**
     * @return HasMany<ProjectMember, $this>
     */
    public function members(): HasMany
    {
        return $this->hasMany(ProjectMember::class, 'role', 'key');
    }

    public function allows(ProjectPermission $permission): bool
    {
        return in_array($permission->value, $this->permissions ?? [], true);
    }
}
