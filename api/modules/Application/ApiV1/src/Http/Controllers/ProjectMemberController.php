<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use App\Models\User;
use App\Notifications\ActivityNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Origo\Application\ApiV1\Http\Resources\ProjectMemberResource;
use Origo\Core\Project\Actions\AddProjectMember;
use Origo\Core\Project\Actions\ChangeProjectMemberRole;
use Origo\Core\Project\Actions\RemoveProjectMember;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Models\ProjectMember;

class ProjectMemberController
{
    public function index(Project $project): AnonymousResourceCollection
    {
        Gate::authorize('view', $project);

        return ProjectMemberResource::collection($project->members()->with('user')->get()->sortBy('user.name')->values());
    }

    public function store(Request $request, Project $project, AddProjectMember $addMember): JsonResponse
    {
        Gate::authorize('manageMembers', $project);

        $data = $request->validate([
            'userId' => ['required', 'integer', Rule::exists('users', 'id')->where('is_active', true)],
            'role' => ['required', 'string', Rule::exists('project_roles', 'key')],
        ]);

        $member = $addMember->handle($project, User::query()->findOrFail($data['userId']), $data['role']);
        $this->tell($request->user(), $member, ActivityNotification::MEMBER_ADDED);

        return (new ProjectMemberResource($member->load('user')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Project $project, ProjectMember $member, ChangeProjectMemberRole $changeRole): ProjectMemberResource
    {
        Gate::authorize('manageMembers', $project);
        $this->ensureBelongs($project, $member);

        $data = $request->validate(['role' => ['required', 'string', Rule::exists('project_roles', 'key')]]);

        $previous = $member->role;
        $member = $changeRole->handle($member, $data['role']);

        if ($previous !== $member->role) {
            $this->tell($request->user(), $member, ActivityNotification::ROLE_CHANGED);
        }

        return new ProjectMemberResource($member->load('user'));
    }

    /** Lets the person know they joined the project or now hold another role in it. */
    private function tell(User $actor, ProjectMember $member, string $kind): void
    {
        $member->loadMissing(['project', 'user', 'projectRole']);

        ActivityNotification::send([$member->user], new ActivityNotification($kind, $actor, ActivityNotification::projectRef($member->project), [
            'role' => ['key' => $member->role, 'name' => $member->projectRole?->name ?? ['vi' => $member->role]],
        ]));
    }

    public function destroy(Project $project, ProjectMember $member, RemoveProjectMember $removeMember): Response
    {
        Gate::authorize('manageMembers', $project);
        $this->ensureBelongs($project, $member);

        $removeMember->handle($member);

        return response()->noContent();
    }

    private function ensureBelongs(Project $project, ProjectMember $member): void
    {
        abort_unless($member->project_id === $project->id, 404);
    }
}
