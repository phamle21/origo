<?php

namespace Origo\Core\Account\Actions;

use App\Models\User;
use Illuminate\Support\Str;

/** Issues a new one-time temporary password and signs the person out everywhere. */
class ResetAccountPassword
{
    private const TEMPORARY_PASSWORD_LENGTH = 14;

    public function handle(User $user): string
    {
        $password = Str::password(self::TEMPORARY_PASSWORD_LENGTH, symbols: false);

        $user->update(['password' => $password]);
        $user->tokens()->delete();

        return $password;
    }
}
