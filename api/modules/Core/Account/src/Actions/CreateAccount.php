<?php

namespace Origo\Core\Account\Actions;

use App\Models\SystemRole;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Creates an account with a one-time temporary password. The password is returned once so the admin can
 * hand it over; only its hash is stored.
 */
class CreateAccount
{
    private const TEMPORARY_PASSWORD_LENGTH = 14;

    /**
     * @param  array{name: string, email: string, title?: string|null, systemRoleId?: string|null}  $data
     * @return array{user: User, temporaryPassword: string}
     */
    public function handle(array $data): array
    {
        $password = Str::password(self::TEMPORARY_PASSWORD_LENGTH, symbols: false);

        $user = User::create([
            'name' => trim($data['name']),
            'email' => mb_strtolower(trim($data['email'])),
            'title' => isset($data['title']) ? trim((string) $data['title']) ?: null : null,
            'system_role_id' => $data['systemRoleId'] ?? SystemRole::defaultId(),
            'password' => $password,
            'is_active' => true,
        ]);

        return ['user' => $user, 'temporaryPassword' => $password];
    }
}
