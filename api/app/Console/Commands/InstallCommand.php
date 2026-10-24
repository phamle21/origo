<?php

namespace App\Console\Commands;

use App\Models\SystemRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Origo\Core\Account\Actions\CreateAccount;
use Throwable;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

/**
 * First-time setup on a new machine or server: checks the app key and the database, creates the
 * tables with their base data (permissions, roles, languages), links public storage and creates the
 * first administrator. Safe to run again: finished steps are skipped and no second admin is made.
 */
class InstallCommand extends Command
{
    private const PASSWORD_MIN_LENGTH = 10;

    protected $signature = 'origo:install
        {--email= : E-mail of the first administrator}
        {--name= : Name of the first administrator}';

    protected $description = 'Install Origo: migrate the database and create the first administrator';

    public function handle(CreateAccount $createAccount): int
    {
        $this->components->info('Installing Origo '.config('app.version'));

        if (! config('app.key')) {
            $this->components->error('APP_KEY is empty. Run `php artisan key:generate` (or set APP_KEY in the environment) first.');

            return self::FAILURE;
        }

        try {
            DB::connection()->getPdo();
        } catch (Throwable $exception) {
            $this->components->error('Cannot reach the database: '.$exception->getMessage());

            return self::FAILURE;
        }

        $this->components->task('Database tables and base data', fn () => $this->callSilently('migrate', ['--force' => true]) === 0);

        if (! file_exists(public_path('storage'))) {
            $this->components->task('Public storage link', fn () => $this->callSilently('storage:link') === 0);
        }

        $adminRoleId = SystemRole::fullAccessId();

        if (! $adminRoleId) {
            $this->components->error('No system role holds every permission, so no administrator can be created.');

            return self::FAILURE;
        }

        if (User::query()->where('system_role_id', $adminRoleId)->where('is_active', true)->exists()) {
            $this->components->info('An administrator already exists; nothing else to do.');

            return self::SUCCESS;
        }

        return $this->createAdministrator($createAccount, $adminRoleId);
    }

    private function createAdministrator(CreateAccount $createAccount, string $adminRoleId): int
    {
        $email = $this->option('email') ?: ($this->input->isInteractive() ? text(
            label: 'Administrator e-mail',
            required: true,
            validate: fn (string $value) => $this->validationError('email', $value, ['email', 'max:255', 'unique:users,email']),
        ) : null);
        $name = $this->option('name') ?: ($this->input->isInteractive() ? text(label: 'Administrator name', required: true) : null);

        if (! $email || ! $name) {
            $this->components->error('Give --email and --name when running without interaction.');

            return self::FAILURE;
        }

        if ($error = $this->validationError('email', $email, ['email', 'max:255', 'unique:users,email'])) {
            $this->components->error($error);

            return self::FAILURE;
        }

        $chosenPassword = $this->input->isInteractive() ? password(
            label: 'Password',
            hint: 'Leave empty to get a temporary password printed once.',
            validate: fn (string $value) => $value === '' ? null : $this->validationError('password', $value, [Password::min(self::PASSWORD_MIN_LENGTH)]),
        ) : '';

        $result = $createAccount->handle(['name' => $name, 'email' => $email, 'title' => 'Admin', 'systemRoleId' => $adminRoleId]);

        if ($chosenPassword !== '') {
            $result['user']->update(['password' => $chosenPassword]);
        }

        $this->components->info("Administrator {$result['user']->email} created.");

        if ($chosenPassword === '') {
            $this->line("  Temporary password (shown once, change it after signing in): {$result['temporaryPassword']}");
        }

        return self::SUCCESS;
    }

    /** @param  list<mixed>  $rules */
    private function validationError(string $field, string $value, array $rules): ?string
    {
        return Validator::make([$field => $value], [$field => $rules])->errors()->first($field) ?: null;
    }
}
