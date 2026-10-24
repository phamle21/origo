<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Origo\Application\ApiV1\Http\Requests\ReplaceScreenImageRequest;
use Origo\Application\ApiV1\Http\Requests\ScreenSourceRules;
use Origo\Application\ApiV1\Http\Requests\StoreScreenRequest;
use Origo\Application\ApiV1\Http\Requests\SyncScreenPointsRequest;
use Origo\Application\ApiV1\Http\Requests\UpdateScreenRequest;
use Origo\Core\Project\Models\Project;
use Origo\Core\Screen\Actions\CreateScreen;
use Origo\Core\Screen\Actions\DeleteScreen;
use Origo\Core\Screen\Actions\RecaptureScreen;
use Origo\Core\Screen\Actions\ReplaceScreenImage;
use Origo\Core\Screen\Actions\SyncScreenPoints;
use Origo\Core\Screen\Actions\UpdateScreen;
use Origo\Core\Screen\Models\Screen;

class ScreenController
{
    public function store(StoreScreenRequest $request, Project $project, CreateScreen $createScreen): JsonResponse
    {
        $screen = $createScreen->handle($project, $request->safe()->only(['name', 'flow', 'purpose']), ScreenSourceRules::toSource($request));

        return response()->json(['data' => ['code' => $screen->code]], 201);
    }

    public function update(UpdateScreenRequest $request, Project $project, Screen $screen, UpdateScreen $updateScreen): JsonResponse
    {
        $updateScreen->handle($screen, $request->validated());

        return response()->json(['data' => ['code' => $screen->code]]);
    }

    public function replaceImage(ReplaceScreenImageRequest $request, Project $project, Screen $screen, ReplaceScreenImage $replaceImage): JsonResponse
    {
        $replaceImage->handle($screen, ScreenSourceRules::toSource($request));

        return response()->json(['data' => ['code' => $screen->code]]);
    }

    public function recapture(Project $project, Screen $screen, RecaptureScreen $recapture): JsonResponse
    {
        Gate::authorize('editDesign', $project);

        $recapture->handle($screen);

        return response()->json(['data' => ['code' => $screen->code]]);
    }

    public function syncPoints(SyncScreenPointsRequest $request, Project $project, Screen $screen, SyncScreenPoints $syncPoints): JsonResponse
    {
        $points = $syncPoints->handle($screen, $request->validated('points'));

        return response()->json(['data' => ['code' => $screen->code, 'pointCount' => $points->count()]]);
    }

    public function destroy(Project $project, Screen $screen, DeleteScreen $deleteScreen): Response
    {
        Gate::authorize('editDesign', $project);

        $deleteScreen->handle($screen);

        return response()->noContent();
    }
}
