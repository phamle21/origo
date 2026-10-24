<?php

namespace App\Support;

use App\Models\SystemRole;
use App\Models\User;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Origo\Core\Account\Actions\CreateAccount;
use RuntimeException;

/**
 * First-time setup shared by `php artisan origo:install` and the web install screen: creates the tables
 * with their base data, links public storage and creates the first administrator. Origo counts as
 * installed once an active administrator exists; after that nothing here runs again.
 */
class Installer
{
    private const LOCK_SECONDS = 120;

    public function __construct(private readonly CreateAccount $createAccount) {}

    public function isInstalled(): bool
    {
        if (! Schema::hasTable('users') || ! Schema::hasTable('system_roles')) {
            return false;
        }

        $adminRoleId = SystemRole::fullAccessId();

        return $adminRoleId !== null
            && User::query()->where('system_role_id', $adminRoleId)->where('is_active', true)->exists();
    }

    /** Applies pending migrations; true when the tables are up to date. */
    public function migrate(): bool
    {
        return Artisan::call('migrate', ['--force' => true]) === 0;
    }

    /** Creates the public/storage link if it is missing; true when it exists. */
    public function linkStorage(): bool
    {
        return file_exists(public_path('storage')) || Artisan::call('storage:link') === 0;
    }

    /**
     * Runs every step and creates the administrator. A lock stops two installs racing; a finished install
     * refuses a second administrator.
     *
     * @param  array{name: string, email: string, password?: string|null}  $admin
     * @return array{user: User, temporaryPassword: string|null}
     */
    public function install(array $admin): array
    {
        try {
            return Cache::lock('origo:install', self::LOCK_SECONDS)->block(5, function () use ($admin) {
                if (! $this->migrate()) {
                    throw new RuntimeException('The database migrations failed.');
                }

                $this->linkStorage();

                if ($this->isInstalled()) {
                    throw new AlreadyInstalledException;
                }

                return $this->createAdministrator($admin);
            });
        } catch (LockTimeoutException) {
            throw new RuntimeException('Another installation is running; try again in a moment.');
        }
    }

    /**
     * @param  array{name: string, email: string, password?: string|null}  $admin
     * @return array{user: User, temporaryPassword: string|null}
     */
    private function createAdministrator(array $admin): array
    {
        $adminRoleId = SystemRole::fullAccessId() ?? throw new RuntimeException('No system role holds every permission.');
        $result = $this->createAccount->handle(['name' => $admin['name'], 'email' => $admin['email'], 'title' => 'Admin', 'systemRoleId' => $adminRoleId]);

        if (! empty($admin['password'])) {
            $result['user']->update(['password' => $admin['password']]);

            return ['user' => $result['user'], 'temporaryPassword' => null];
        }

        return $result;
    }
}
