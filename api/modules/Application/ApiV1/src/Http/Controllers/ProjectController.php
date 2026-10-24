<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Origo\Application\ApiV1\Http\Requests\StoreProjectRequest;
use Origo\Application\ApiV1\Http\Requests\UpdateProjectRequest;
use Origo\Application\ApiV1\Http\Resources\ProjectResource;
use Origo\Core\Project\Actions\CreateProject;
use Origo\Core\Project\Actions\DeleteProject;
use Origo\Core\Project\Actions\DeleteProjectForever;
use Origo\Core\Project\Actions\UpdateProject;
use Origo\Core\Project\Enums\ProjectPermission;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Support\ProjectRoles;

class ProjectController
{
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Project::class);

        $projects = Project::query()
            ->visibleTo($request->user())
            ->with(['owner', 'members' => fn ($members) => $members->whereIn('role', app(ProjectRoles::class)->keysWith(ProjectPermission::ManageMembers))->with('user:id,name,email,title')])
            ->withCount(['screens', 'points', 'members'])
            ->oldest()
            ->paginate(min($request->integer('per_page', 20), 100));

        return ProjectResource::collection($projects);
    }

    public function store(StoreProjectRequest $request, CreateProject $createProject): ProjectResource
    {
        $manager = $request->filled('managerId') ? User::query()->findOrFail($request->integer('managerId')) : null;
        $project = $createProject->handle($request->user(), $request->safe()->except('managerId'), $manager);

        return new ProjectResource($project->load('owner'));
    }

    public function show(Project $project): ProjectResource
    {
        Gate::authorize('view', $project);

        return new ProjectResource($project->load('owner'));
    }

    public function update(UpdateProjectRequest $request, Project $project, UpdateProject $updateProject): ProjectResource
    {
        Gate::authorize('update', $project);

        return new ProjectResource($updateProject->handle($project, $request->validated())->load('owner'));
    }

    public function archive(Project $project): ProjectResource
    {
        Gate::authorize('archive', $project);

        $project->update(['archived_at' => $project->archived_at ?? now()]);

        return new ProjectResource($project->load('owner'));
    }

    public function unarchive(Project $project): ProjectResource
    {
        Gate::authorize('archive', $project);

        $project->update(['archived_at' => null]);

        return new ProjectResource($project->load('owner'));
    }

    /** Deleting for good: the body must carry the project code, typed by the person (like GitHub). */
    public function destroyForever(Request $request, Project $project, DeleteProjectForever $deleteForever): Response
    {
        Gate::authorize('delete', $project);

        $data = $request->validate(['confirmCode' => ['required', 'string', 'max:16']]);
        $deleteForever->handle($project, $data['confirmCode']);

        return response()->noContent();
    }

    public function destroy(Project $project, DeleteProject $deleteProject): Response
    {
        Gate::authorize('delete', $project);

        $deleteProject->handle($project);

        return response()->noContent();
    }
}
