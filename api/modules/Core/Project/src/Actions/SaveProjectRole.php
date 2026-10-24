<?php

namespace Origo\Core\Project\Actions;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Origo\Core\Project\Enums\ProjectPermission;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Models\ProjectRole;
use Origo\Core\Project\Support\LocalizedText;
use Origo\Core\Project\Support\ProjectRoles;

class SaveProjectRole
{
    /**
     * @param  array{name: array<string, mixed>, description?: array<string, mixed>|null, permissions?: list<string>}  $data
     */
    public function handle(array $data, ?ProjectRole $role = null): ProjectRole
    {
        $roles = app(ProjectRoles::class);
        $permissions = ProjectPermission::normalize($data['permissions'] ?? []);

        return DB::transaction(function () use ($data, $role, $roles, $permissions) {
            if ($role && $role->allows(ProjectPermission::ManageMembers) && ! in_array(ProjectPermission::ManageMembers->value, $permissions, true)) {
                $this->ensureProjectsKeepAManager($role, $roles);
            }

            $role ??= new ProjectRole([
                'key' => $this->uniqueKey($data['name']),
                'position' => (int) ProjectRole::query()->max('position') + 1,
            ]);

            $role->fill([
                'name' => LocalizedText::normalize($data['name']),
                'description' => isset($data['description']) ? LocalizedText::normalize($data['description']) : null,
                'permissions' => $permissions,
            ])->save();

            $roles->forget();

            return $role;
        });
    }

    /** Projects whose only member managers hold this role would be left without one. */
    private function ensureProjectsKeepAManager(ProjectRole $role, ProjectRoles $roles): void
    {
        $otherManagers = array_values(array_diff($roles->keysWith(ProjectPermission::ManageMembers), [$role->key]));

        $stranded = Project::query()
            ->whereHas('members', fn (Builder $members) => $members->where('role', $role->key))
            ->whereDoesntHave('members', fn (Builder $members) => $members->whereIn('role', $otherManagers))
            ->count();

        if ($stranded > 0) {
            throw ValidationException::withMessages([
                'permissions' => "{$stranded} project(s) would be left with nobody who can manage members.",
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $name
     */
    private function uniqueKey(array $name): string
    {
        $base = Str::limit(Str::slug(LocalizedText::primary(LocalizedText::normalize($name))) ?: 'role', 50, '');
        $key = $base;

        for ($suffix = 2; ProjectRole::query()->where('key', $key)->exists(); $suffix++) {
            $key = "{$base}-{$suffix}";
        }

        return $key;
    }
}
