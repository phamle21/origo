<?php

namespace Origo\Application\ApiV1\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Origo\Core\Project\Support\LocalizedText;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'title' => $this->title,
            'initials' => $this->initials(),
            'isAdmin' => $this->isAdmin(),
            'permissions' => $this->permissions(),
            'systemRole' => $this->systemRole ? [
                'id' => $this->systemRole->id,
                'key' => $this->systemRole->key,
                'name' => LocalizedText::normalize($this->systemRole->name),
            ] : null,
            'isActive' => $this->is_active,
            'projectCount' => $this->whenCounted('projectMemberships'),
        ];
    }
}
