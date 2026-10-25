<?php

use App\Models\SystemRole;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Origo\Core\Account\Actions\CreateAccount;

// First start on a new server: the database has roles and permissions (migrations) but nobody can sign
// in yet. This creates the first administrator and prints a temporary password once.
Artisan::command('origo:create-admin {email} {name}', function (string $email, string $name) {
    $adminRoleId = SystemRole::fullAccessId();

    if (! $adminRoleId) {
        $this->error('No system role holds every permission. Run the migrations first.');

        return 1;
    }

    $result = app(CreateAccount::class)->handle(['name' => $name, 'email' => $email, 'title' => 'Admin', 'systemRoleId' => $adminRoleId]);

    $this->info("Administrator {$result['user']->email} created.");
    $this->line("Temporary password (shown once, change it after signing in): {$result['temporaryPassword']}");

    return 0;
})->purpose('Create the first Origo administrator');

// Weekly reports: last week's progress is frozen every Monday before the 10:00 report deadline (Vietnam time).
Schedule::command('origo:plan-weekly-snapshot')->weeklyOn(1, '09:00')->timezone('Asia/Ho_Chi_Minh')->withoutOverlapping();
