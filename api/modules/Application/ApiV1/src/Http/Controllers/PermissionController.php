<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Origo\Core\Project\Support\LocalizedText;

/**
 * The permission catalog of one scope. Anyone signed in may read the project scope (the Members page
 * explains roles with it); the system scope is for people who see system roles. Admins can rename,
 * describe, group and reorder permissions, never add or remove them: each one is checked by code.
 */
class PermissionController
{
    public function index(string $scope): JsonResponse
    {
        abort_unless(array_key_exists($scope, Permission::GROUPS), 404);

        if ($scope === 'system') {
            Gate::authorize('view-system-roles');
        }

        $permissions = Permission::query()->where('scope', $scope)->orderBy('position')->get();

        return response()->json(['data' => $permissions->map(fn (Permission $permission) => $this->present($permission))]);
    }

    public function update(Request $request, string $scope, Permission $permission): JsonResponse
    {
        Gate::authorize('manage-settings');
        abort_unless($permission->scope === $scope, 404);

        $data = $request->validate([
            ...LocalizedText::rules('name', required: true, max: 80),
            ...LocalizedText::rules('description', required: false, max: 300),
            'group' => ['required', Rule::in(Permission::GROUPS[$scope])],
            'position' => ['required', 'integer', 'min:0', 'max:999'],
        ]);

        $permission->update([
            'name' => LocalizedText::normalize($data['name']),
            'description' => isset($data['description']) ? LocalizedText::normalize($data['description']) : null,
            'group' => $data['group'],
            'position' => $data['position'],
        ]);

        return response()->json(['data' => $this->present($permission)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Permission $permission): array
    {
        return [
            'id' => $permission->id,
            'key' => $permission->key,
            'group' => $permission->group,
            'name' => LocalizedText::normalize($permission->name),
            'description' => LocalizedText::normalize($permission->description ?? []),
            'position' => $permission->position,
        ];
    }
}
