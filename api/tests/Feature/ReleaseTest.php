<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ReleaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_reports_the_version_and_hides_software_versions_in_production(): void
    {
        $this->getJson('/api/health')->assertOk()->assertJsonPath('version', config('app.version'))->assertJsonPath('status', 'ok');

        $this->app['env'] = 'production';
        $this->getJson('/api/health')->assertOk()->assertJsonMissingPath('laravel')->assertJsonMissingPath('php');
    }

    public function test_the_first_administrator_is_created_with_every_permission(): void
    {
        $this->artisan('origo:create-admin', ['email' => 'Boss@Example.com', 'name' => 'Boss'])
            ->expectsOutputToContain('Administrator boss@example.com created.')
            ->expectsOutputToContain('Temporary password')
            ->assertExitCode(0);

        $this->assertTrue(User::query()->where('email', 'boss@example.com')->firstOrFail()->isAdmin());
    }

    public function test_install_creates_the_first_administrator_once(): void
    {
        $this->artisan('origo:install', ['--email' => 'Owner@Example.com', '--name' => 'Owner', '--no-interaction' => true])
            ->expectsOutputToContain('Administrator owner@example.com created.')
            ->expectsOutputToContain('Temporary password')
            ->assertExitCode(0);

        $this->assertTrue(User::query()->where('email', 'owner@example.com')->firstOrFail()->isAdmin());

        $this->artisan('origo:install', ['--no-interaction' => true])
            ->expectsOutputToContain('An administrator already exists')
            ->assertExitCode(0);

        $this->assertSame(1, User::query()->count());
    }

    public function test_install_asks_for_the_administrator_and_accepts_a_chosen_password(): void
    {
        $this->artisan('origo:install')
            ->expectsQuestion('Administrator e-mail', 'lead@example.com')
            ->expectsQuestion('Administrator name', 'Lead')
            ->expectsQuestion('Password', 'a-strong-password')
            ->doesntExpectOutputToContain('Temporary password')
            ->assertExitCode(0);

        $this->assertTrue(Hash::check('a-strong-password', User::query()->where('email', 'lead@example.com')->firstOrFail()->password));
    }

    public function test_install_without_interaction_needs_the_administrator_details(): void
    {
        $this->artisan('origo:install', ['--no-interaction' => true])
            ->expectsOutputToContain('Give --email and --name')
            ->assertExitCode(1);

        $this->assertSame(0, User::query()->count());
    }

    public function test_the_api_root_names_itself_instead_of_the_framework_welcome_page(): void
    {
        $this->get('/')->assertOk()->assertJsonPath('app', config('app.name'))->assertJsonPath('version', config('app.version'));
    }

    public function test_the_version_comes_from_the_version_file(): void
    {
        $this->assertSame(trim((string) file_get_contents(base_path('VERSION'))), config('app.version'));
        $this->assertMatchesRegularExpression('/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/', config('app.version'));
    }
}
