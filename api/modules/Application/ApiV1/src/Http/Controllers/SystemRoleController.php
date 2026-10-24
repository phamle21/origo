<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use App\Enums\SystemPermission;
use App\Models\SystemRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Origo\Core\Account\Actions\SaveSystemRole;
use Origo\Core\Project\Support\LocalizedText;

/** System roles: named sets of system permissions. Built-in roles can be edited but never deleted. */
class SystemRoleController
{
    public function index(): JsonResponse
    {
        Gate::authorize('view-system-roles');

        $roles = SystemRole::query()->withCount('users')->orderBy('created_at')->get();

        return response()->json(['data' => $roles->map(fn (SystemRole $role) => $this->present($role))]);
    }

    public function store(Request $request, SaveSystemRole $saveRole): JsonResponse
    {
        Gate::authorize('manage-settings');

        $role = $saveRole->handle($this->validated($request));

        return response()->json(['data' => $this->present($role->loadCount('users'))], 201);
    }

    public function update(Request $request, SystemRole $role, SaveSystemRole $saveRole): JsonResponse
    {
        Gate::authorize('manage-settings');

        $role = $saveRole->handle($this->validated($request), $role);

        return response()->json(['data' => $this->present($role->loadCount('users'))]);
    }

    public function destroy(SystemRole $role): Response
    {
        Gate::authorize('manage-settings');

        abort_if($role->is_default, 422, 'Choose another default role before deleting this one.');
        abort_if($role->users()->exists(), 422, 'Move everyone to another role before deleting this one.');

        $role->delete();

        return response()->noContent();
    }

    /**
     * @return array{name: array<string, mixed>, description?: array<string, mixed>|null, permissions?: list<string>, isDefault?: bool}
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            ...LocalizedText::rules('name', required: true, max: 60),
            ...LocalizedText::rules('description', required: false, max: 300),
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', Rule::in(SystemPermission::values())],
            'isDefault' => ['sometimes', 'boolean'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(SystemRole $role): array
    {
        return [
            'id' => $role->id,
            'key' => $role->key,
            'name' => LocalizedText::normalize($role->name),
            'description' => LocalizedText::normalize($role->description ?? []),
            'permissions' => $role->effectivePermissions(),
            'isDefault' => $role->is_default,
            'userCount' => $role->users_count ?? 0,
        ];
    }
}
