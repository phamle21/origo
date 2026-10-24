<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Origo\Application\ApiV1\Http\Resources\UserResource;
use Origo\Core\Account\Actions\CreateAccount;
use Origo\Core\Account\Actions\ResetAccountPassword;
use Origo\Core\Account\Actions\UpdateAccount;
use Origo\Core\Project\Models\ProjectMember;
use Origo\Core\Project\Support\LocalizedText;

class AdminUserController
{
    private const PAGE_SIZE = 50;

    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('manage-users');

        $query = trim($request->string('q')->toString());
        $pattern = '%'.mb_strtolower(addcslashes($query, '%_\\')).'%';

        return UserResource::collection(User::query()
            ->with('systemRole')
            // Deleted projects are soft deleted, so their memberships stay; they must not count.
            ->withCount(['projectMemberships' => fn ($memberships) => $memberships->whereHas('project')])
            ->when($query !== '', fn ($builder) => $builder->where(fn ($inner) => $inner->whereRaw('lower(name) like ?', [$pattern])->orWhereRaw('lower(email) like ?', [$pattern])))
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->paginate(self::PAGE_SIZE));
    }

    public function store(Request $request, CreateAccount $createAccount): JsonResponse
    {
        Gate::authorize('manage-users');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'title' => ['nullable', 'string', 'max:40'],
            'systemRoleId' => ['nullable', 'string', Rule::exists('system_roles', 'id')],
        ]);

        $created = $createAccount->handle($data);

        return response()->json(['data' => (new UserResource($created['user']))->resolve($request), 'temporaryPassword' => $created['temporaryPassword']], 201);
    }

    public function update(Request $request, User $user, UpdateAccount $updateAccount): UserResource
    {
        Gate::authorize('manage-users');

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'title' => ['sometimes', 'nullable', 'string', 'max:40'],
            'systemRoleId' => ['sometimes', 'string', Rule::exists('system_roles', 'id')],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        return new UserResource($updateAccount->handle($request->user(), $user, $data));
    }

    public function resetPassword(User $user, ResetAccountPassword $resetPassword): JsonResponse
    {
        Gate::authorize('manage-users');

        return response()->json(['temporaryPassword' => $resetPassword->handle($user)]);
    }

    public function show(User $user): UserResource
    {
        Gate::authorize('manage-users');

        return new UserResource($user->load('systemRole')->loadCount(['projectMemberships' => fn ($memberships) => $memberships->whereHas('project')]));
    }

    /** Every project the person belongs to, with their role, so an admin can assign them from one place. */
    public function projects(User $user): JsonResponse
    {
        Gate::authorize('manage-users');

        $memberships = ProjectMember::query()
            ->where('user_id', $user->id)
            ->whereHas('project')
            ->with('project:id,code,name')
            ->get()
            ->sortBy(fn (ProjectMember $member) => $member->project->code)
            ->values();

        return response()->json(['data' => $memberships->map(fn (ProjectMember $member) => [
            'memberId' => $member->id,
            'role' => $member->role,
            'project' => ['code' => $member->project->code, 'name' => LocalizedText::normalize($member->project->name)],
        ])]);
    }
}
