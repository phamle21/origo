<?php

namespace Origo\Core\Account\Actions;

use App\Enums\SystemPermission;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

/**
 * Roles are ordinary data, so any change could take away the last way back in. Called inside the
 * transaction after a change: when no active person can manage settings any more, the change is
 * refused and rolled back.
 */
final class EnsureSomeoneManagesSettings
{
    public static function check(string $field): void
    {
        $someone = User::query()
            ->where('is_active', true)
            ->whereHas('systemRole', fn (Builder $role) => $role->whereJsonContains('permissions', SystemPermission::ManageSettings->value))
            ->exists();

        if (! $someone) {
            throw ValidationException::withMessages([$field => 'At least one active person must keep the right to manage settings.']);
        }
    }
}
