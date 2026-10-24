<?php

namespace Origo\Application\ApiV1\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Support\LocalizedText;
use Origo\Core\Screen\Models\Concept;
use Origo\Core\Screen\Models\Screen;
use Origo\Core\Screen\Models\ScreenPoint;

/**
 * The whole screen map of one project in one response. Readers derive reverse dependencies and
 * shared-concept impacts from it, which needs every screen at once. Dependencies are referenced as
 * `SC-01#2`; point ids are included for editors.
 *
 * @mixin Project
 */
class ProjectMapResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing(['concepts', 'screens.planItems', 'screens.points.concepts', 'screens.points.dependencies.screen', 'screens.points.comments.user', 'screens.points.comments.mentions']);

        return [
            'code' => $this->code,
            'name' => LocalizedText::normalize($this->name),
            'description' => LocalizedText::normalize($this->description),
            ...ProjectAccess::for($this->resource, $request->user()),
            'concepts' => $this->concepts->map(fn (Concept $concept) => [
                'key' => $concept->key,
                'name' => $concept->name,
                'description' => $concept->description,
                'alsoUsedIn' => $concept->also_used_in,
            ])->values(),
            'screens' => $this->screens->map(fn (Screen $screen) => [
                'id' => $screen->id,
                'code' => $screen->code,
                'name' => $screen->name,
                'flow' => $screen->flow,
                'purpose' => $screen->purpose,
                'image' => ['src' => $screen->imageUrl(), 'width' => $screen->image_width, 'height' => $screen->image_height],
                'source' => ['kind' => $screen->source_type, 'url' => $screen->source_url, 'width' => $screen->render_width],
                'features' => $screen->planItems->map(fn ($feature) => ['id' => $feature->id, 'name' => LocalizedText::normalize($feature->name)])->values(),
                'points' => $screen->points->map(fn (ScreenPoint $point) => [
                    'id' => $point->id,
                    'number' => $point->number,
                    'title' => $point->title,
                    'box' => $point->box,
                    'basic' => $point->basic,
                    'detail' => $point->detail,
                    'tests' => $point->tests,
                    'history' => $point->history,
                    'concepts' => $point->concepts->pluck('key')->values(),
                    'dependsOn' => $point->dependencies->map(fn (ScreenPoint $dependency) => "{$dependency->screen->code}#{$dependency->number}")->values(),
                    'comments' => PointCommentResource::collection($point->comments)->resolve($request),
                ])->values(),
            ])->values(),
        ];
    }
}
