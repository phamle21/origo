<?php

namespace Origo\Core\Account;

use App\Enums\SystemPermission;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AccountServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Gate::define('manage-users', fn (User $user) => $user->hasPermission(SystemPermission::ManageUsers));
        Gate::define('manage-settings', fn (User $user) => $user->hasPermission(SystemPermission::ManageSettings));
        // The people pages pick a role for each account, so they may read the role list too.
        Gate::define('view-system-roles', fn (User $user) => $user->hasPermission(SystemPermission::ManageUsers) || $user->hasPermission(SystemPermission::ManageSettings));
    }
}
