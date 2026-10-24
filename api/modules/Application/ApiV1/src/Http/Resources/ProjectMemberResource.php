<?php

namespace Origo\Application\ApiV1\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Origo\Core\Project\Models\ProjectMember;

/**
 * @mixin ProjectMember
 */
class ProjectMemberResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'role' => $this->role,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'title' => $this->user->title,
                'initials' => $this->user->initials(),
                'isActive' => $this->user->is_active,
            ],
        ];
    }
}
