<?php

namespace Origo\Core\Project\Support;

use Illuminate\Support\Collection;
use Origo\Core\Project\Enums\ProjectPermission;
use Origo\Core\Project\Models\ProjectRole;

/**
 * The project roles, loaded once per request (the service is scoped), so permission checks across a
 * page cost one query.
 */
class ProjectRoles
{
    /** @var Collection<string, ProjectRole>|null */
    private ?Collection $roles = null;

    /** @return Collection<string, ProjectRole> keyed by role key, in display order */
    public function all(): Collection
    {
        return $this->roles ??= ProjectRole::query()->orderBy('position')->orderBy('created_at')->get()->keyBy('key');
    }

    public function find(?string $key): ?ProjectRole
    {
        return $key === null ? null : $this->all()->get($key);
    }

    /** @return list<string> keys of the roles that hold the permission */
    public function keysWith(ProjectPermission $permission): array
    {
        return $this->all()->filter(fn (ProjectRole $role) => $role->allows($permission))->keys()->values()->all();
    }

    /**
     * The role a new project's first member gets: the first role that can manage members, preferring
     * one that holds every permission.
     */
    public function ownerRole(): ?ProjectRole
    {
        $managers = $this->all()->filter(fn (ProjectRole $role) => $role->allows(ProjectPermission::ManageMembers));

        return $managers->first(fn (ProjectRole $role) => count($role->permissions ?? []) === count(ProjectPermission::cases())) ?? $managers->first();
    }

    public function forget(): void
    {
        $this->roles = null;
    }
}
