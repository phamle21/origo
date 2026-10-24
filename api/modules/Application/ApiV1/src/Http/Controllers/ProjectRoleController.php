<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Origo\Core\Project\Actions\SaveProjectRole;
use Origo\Core\Project\Enums\ProjectPermission;
use Origo\Core\Project\Models\ProjectRole;
use Origo\Core\Project\Support\LocalizedText;

/**
 * Project roles admins create and tick. Anyone signed in may list them: role names and rights are
 * shown on every project's Members page.
 */
class ProjectRoleController
{
    public function index(): JsonResponse
    {
        $roles = ProjectRole::query()->withCount('members')->orderBy('position')->orderBy('created_at')->get();

        return response()->json(['data' => $roles->map(fn (ProjectRole $role) => $this->present($role))]);
    }

    public function store(Request $request, SaveProjectRole $saveRole): JsonResponse
    {
        Gate::authorize('manage-settings');

        $role = $saveRole->handle($this->validated($request));

        return response()->json(['data' => $this->present($role->loadCount('members'))], 201);
    }

    public function update(Request $request, ProjectRole $role, SaveProjectRole $saveRole): JsonResponse
    {
        Gate::authorize('manage-settings');

        $role = $saveRole->handle($this->validated($request), $role);

        return response()->json(['data' => $this->present($role->loadCount('members'))]);
    }

    public function destroy(ProjectRole $role): Response
    {
        Gate::authorize('manage-settings');

        if ($role->members()->exists()) {
            throw ValidationException::withMessages(['role' => 'Move everyone to another role before deleting this one.']);
        }

        $role->delete();

        return response()->noContent();
    }

    /**
     * @return array{name: array<string, mixed>, description?: array<string, mixed>|null, permissions?: list<string>}
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            ...LocalizedText::rules('name', required: true, max: 60),
            ...LocalizedText::rules('description', required: false, max: 300),
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', Rule::in(ProjectPermission::values())],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(ProjectRole $role): array
    {
        return [
            'id' => $role->id,
            'key' => $role->key,
            'name' => LocalizedText::normalize($role->name),
            'description' => LocalizedText::normalize($role->description ?? []),
            'permissions' => ProjectPermission::normalize($role->permissions ?? []),
            'memberCount' => $role->members_count ?? 0,
        ];
    }
}
