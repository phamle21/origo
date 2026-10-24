<?php

namespace Origo\Application\ApiV1\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Origo\Core\Project\Models\Project;

/**
 * @mixin Project
 */
class ProjectResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'owner' => $this->whenLoaded('owner', fn () => [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
            ]),
            ...ProjectAccess::for($this->resource, $request->user()),
            'screenCount' => $this->whenCounted('screens'),
            'pointCount' => $this->whenCounted('points'),
            'memberCount' => $this->whenCounted('members'),
            // Only the list loads members, filtered to managers, to show who runs each project.
            'managers' => $this->whenLoaded('members', fn () => $this->members->map(fn ($member) => [
                'id' => $member->user->id,
                'name' => $member->user->name,
                'initials' => $member->user->initials(),
            ])->values()),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
