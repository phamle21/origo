<?php

namespace Origo\Core\Account\Actions;

use App\Models\User;

/**
 * Sets a new password chosen by the person themselves and signs out their other devices, so a
 * temporary password handed out by an admin stops being useful anywhere else.
 */
class ChangeOwnPassword
{
    public function handle(User $user, string $password, ?int $keepTokenId = null): void
    {
        $user->forceFill(['password' => $password])->save();
        $user->tokens()->when($keepTokenId, fn ($tokens) => $tokens->whereKeyNot($keepTokenId))->delete();
    }
}
