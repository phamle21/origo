<?php

namespace Origo\Core\Project\Models;

use App\Enums\SystemPermission;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Origo\Core\Project\Database\Factories\ProjectFactory;
use Origo\Core\Project\Enums\ProjectPermission;
use Origo\Core\Project\Support\ProjectRoles;

#[Fillable(['code', 'name', 'description', 'owner_id', 'archived_at'])]
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use HasFactory, HasUlids, SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'name' => 'array',
            'description' => 'array',
            'archived_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * @return HasMany<ProjectMember, $this>
     */
    public function members(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    /** The person's role in this project, or null when they are not a member. */
    public function roleOf(User $user): ?ProjectRole
    {
        return app(ProjectRoles::class)->find($this->members()->where('user_id', $user->id)->value('role'));
    }

    /** Whether the person's role in this project holds the permission. */
    public function allows(User $user, ProjectPermission $permission): bool
    {
        return (bool) $this->roleOf($user)?->allows($permission);
    }

    /**
     * Projects the person can open: all of them for an admin, otherwise the ones they belong to.
     *
     * @param  Builder<Project>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        if (! $user->hasPermission(SystemPermission::ViewAllProjects) && ! $user->hasPermission(SystemPermission::ManageAllProjects)) {
            // A member whose role may not read (Settings → Project roles) does not see the project at all.
            $readers = app(ProjectRoles::class)->keysWith(ProjectPermission::Read);
            $query->whereHas('members', fn (Builder $members) => $members->where('user_id', $user->id)->whereIn('role', $readers));
        }
    }

    protected static function newFactory(): ProjectFactory
    {
        return ProjectFactory::new();
    }
}
