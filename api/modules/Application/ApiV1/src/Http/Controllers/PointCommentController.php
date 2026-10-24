<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Origo\Application\ApiV1\Http\Requests\StorePointCommentRequest;
use Origo\Application\ApiV1\Http\Resources\PointCommentResource;
use Origo\Core\Screen\Actions\AddPointComment;
use Origo\Core\Screen\Models\ScreenPoint;

class PointCommentController
{
    public function store(StorePointCommentRequest $request, ScreenPoint $point, AddPointComment $addComment): JsonResponse
    {
        Gate::authorize('view', $point->screen->project);

        $comment = $addComment->handle($point, $request->user(), $request->string('text')->toString(), array_map('intval', $request->input('mentionIds', [])));

        return (new PointCommentResource($comment->load(['user', 'mentions'])))->response()->setStatusCode(201);
    }
}
