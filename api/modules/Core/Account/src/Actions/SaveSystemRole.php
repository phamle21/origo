<?php

namespace Origo\Core\Account\Actions;

use App\Enums\SystemPermission;
use App\Models\SystemRole;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Origo\Core\Project\Support\LocalizedText;

class SaveSystemRole
{
    /**
     * @param  array{name: array<string, mixed>, description?: array<string, mixed>|null, permissions?: list<string>, isDefault?: bool}  $data
     */
    public function handle(array $data, ?SystemRole $role = null): SystemRole
    {
        return DB::transaction(function () use ($data, $role) {
            $role ??= new SystemRole(['key' => $this->uniqueKey($data['name']), 'is_default' => false]);

            $role->fill([
                'name' => LocalizedText::normalize($data['name']),
                'description' => isset($data['description']) ? LocalizedText::normalize($data['description']) : null,
                'permissions' => array_values(array_intersect(SystemPermission::values(), $data['permissions'] ?? [])),
            ]);

            // Exactly one role is the default for new accounts; choosing another one moves the mark.
            if (($data['isDefault'] ?? false) === true) {
                SystemRole::query()->whereKeyNot($role->getKey() ?? '')->update(['is_default' => false]);
                $role->is_default = true;
            }

            $role->save();
            EnsureSomeoneManagesSettings::check('permissions');

            return $role;
        });
    }

    /**
     * @param  array<string, mixed>  $name
     */
    private function uniqueKey(array $name): string
    {
        $normalized = LocalizedText::normalize($name);
        $base = Str::limit(Str::slug(LocalizedText::primary($normalized)) ?: 'role', 50, '');
        $key = $base;

        for ($suffix = 2; SystemRole::query()->where('key', $key)->exists(); $suffix++) {
            $key = "{$base}-{$suffix}";
        }

        return $key;
    }
}
