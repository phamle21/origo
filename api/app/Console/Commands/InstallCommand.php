<?php

namespace App\Console\Commands;

use App\Support\Installer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Throwable;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

/**
 * First-time setup from the command line; the web install screen (/install) does the same. Checks the app
 * key and the database, creates the tables with their base data (permissions, roles, languages), links
 * public storage and creates the first administrator. Safe to run again: no second admin is made.
 */
class InstallCommand extends Command
{
    public const PASSWORD_MIN_LENGTH = 10;

    protected $signature = 'origo:install
        {--email= : E-mail of the first administrator}
        {--name= : Name of the first administrator}';

    protected $description = 'Install Origo: migrate the database and create the first administrator';

    public function handle(Installer $installer): int
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

        $this->components->task('Database tables and base data', fn () => $installer->migrate());
        $this->components->task('Public storage link', fn () => $installer->linkStorage());

        if ($installer->isInstalled()) {
            $this->components->info('An administrator already exists; nothing else to do.');

            return self::SUCCESS;
        }

        $admin = $this->askAdministrator();

        if (! $admin) {
            return self::FAILURE;
        }

        $result = $installer->install($admin);

        $this->components->info("Administrator {$result['user']->email} created.");

        if ($result['temporaryPassword']) {
            $this->line("  Temporary password (shown once, change it after signing in): {$result['temporaryPassword']}");
        }

        return self::SUCCESS;
    }

    /** @return array{name: string, email: string, password: string}|null */
    private function askAdministrator(): ?array
    {
        $isInteractive = $this->input->isInteractive();
        $emailRules = ['email', 'max:255', 'unique:users,email'];

        $email = $this->option('email') ?: ($isInteractive ? text(
            label: 'Administrator e-mail',
            required: true,
            validate: fn (string $value) => $this->validationError('email', $value, $emailRules),
        ) : null);
        $name = $this->option('name') ?: ($isInteractive ? text(label: 'Administrator name', required: true) : null);

        if (! $email || ! $name) {
            $this->components->error('Give --email and --name when running without interaction.');

            return null;
        }

        if ($error = $this->validationError('email', $email, $emailRules)) {
            $this->components->error($error);

            return null;
        }

        $password = $isInteractive ? password(
            label: 'Password',
            hint: 'Leave empty to get a temporary password printed once.',
            validate: fn (string $value) => $value === '' ? null : $this->validationError('password', $value, [Password::min(self::PASSWORD_MIN_LENGTH)]),
        ) : '';

        return ['name' => $name, 'email' => $email, 'password' => $password];
    }

    /** @param  list<mixed>  $rules */
    private function validationError(string $field, string $value, array $rules): ?string
    {
        return Validator::make([$field => $value], [$field => $rules])->errors()->first($field) ?: null;
    }
}
