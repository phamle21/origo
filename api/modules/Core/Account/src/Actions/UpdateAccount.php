<?php

namespace Origo\Core\Account\Actions;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Changes an account's details, admin flag or active state. Admins cannot lock themselves out, and a
 * deactivated account loses its open sessions immediately.
 */
class UpdateAccount
{
    /**
     * @param  array{name?: string, email?: string, title?: string|null, systemRoleId?: string, isActive?: bool}  $data
     */
    public function handle(User $actor, User $user, array $data): User
    {
        $isSelf = $actor->is($user);

        $changesRole = isset($data['systemRoleId']) && $data['systemRoleId'] !== $user->system_role_id;
        $deactivates = ($data['isActive'] ?? true) === false;

        if ($isSelf && ($changesRole || $deactivates)) {
            throw ValidationException::withMessages(['systemRoleId' => 'You cannot change your own role or deactivate yourself.']);
        }

        $user->fill(array_filter([
            'name' => isset($data['name']) ? trim($data['name']) : null,
            'email' => isset($data['email']) ? mb_strtolower(trim($data['email'])) : null,
        ], fn ($value) => $value !== null));

        if (array_key_exists('title', $data)) {
            $user->title = $data['title'] !== null ? (trim($data['title']) ?: null) : null;
        }

        if (isset($data['systemRoleId'])) {
            $user->system_role_id = $data['systemRoleId'];
        }

        if (array_key_exists('isActive', $data)) {
            $user->is_active = $data['isActive'];
        }

        DB::transaction(function () use ($user, $changesRole, $deactivates) {
            $user->save();

            // Someone must always be able to administer the system.
            if ($changesRole || $deactivates) {
                EnsureSomeoneManagesSettings::check('systemRoleId');
            }
        });

        // The role may have changed; drop the cached relation so callers see the new permissions.
        $user->unsetRelation('systemRole');

        if (! $user->is_active) {
            $user->tokens()->delete();
        }

        return $user;
    }
}
