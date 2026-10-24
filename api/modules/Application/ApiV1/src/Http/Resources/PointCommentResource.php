<?php

namespace Origo\Application\ApiV1\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Origo\Core\Screen\Models\PointComment;

/**
 * @mixin PointComment
 */
class PointCommentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'authorInitials' => $this->user->initials(),
            'author' => $this->user->name,
            'role' => $this->user->title ?? '',
            'text' => $this->body,
            'mentions' => $this->whenLoaded('mentions', fn () => $this->mentions->map(fn ($user) => ['id' => $user->id, 'name' => $user->name])->values(), []),
            'at' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
