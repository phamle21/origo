<?php

namespace Origo\Application\ApiV1\Tests;

use App\Models\SystemRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstallApiTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, string> */
    private function admin(array $overrides = []): array
    {
        return [
            'name' => 'Owner',
            'email' => 'owner@example.com',
            'password' => 'a-strong-password',
            'password_confirmation' => 'a-strong-password',
            ...$overrides,
        ];
    }

    public function test_a_new_install_is_open_and_creates_the_first_administrator(): void
    {
        $this->getJson('/api/v1/install')
            ->assertOk()
            ->assertJsonPath('data.isInstalled', false)
            ->assertJsonPath('data.isTokenRequired', false);

        $this->postJson('/api/v1/install', $this->admin())->assertCreated()->assertJsonPath('data.email', 'owner@example.com');

        $this->assertTrue(User::query()->where('email', 'owner@example.com')->firstOrFail()->isAdmin());
        $this->postJson('/api/v1/auth/login', ['email' => 'owner@example.com', 'password' => 'a-strong-password'])->assertOk();
        $this->getJson('/api/v1/install')->assertJsonPath('data.isInstalled', true);
    }

    public function test_the_screen_closes_once_an_administrator_exists(): void
    {
        User::factory()->create(['system_role_id' => SystemRole::fullAccessId()]);

        $this->postJson('/api/v1/install', $this->admin(['email' => 'intruder@example.com']))->assertStatus(409);

        $this->assertFalse(User::query()->where('email', 'intruder@example.com')->exists());
    }

    public function test_the_administrator_details_are_validated(): void
    {
        $this->postJson('/api/v1/install', $this->admin(['email' => 'not-an-email', 'password' => 'short', 'password_confirmation' => 'short']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);

        $this->assertSame(0, User::query()->count());
    }

    public function test_production_needs_the_configured_install_token(): void
    {
        $this->app['env'] = 'production';

        $this->getJson('/api/v1/install')->assertJsonPath('data.isTokenRequired', true)->assertJsonPath('data.isTokenConfigured', false);
        $this->postJson('/api/v1/install', $this->admin())->assertForbidden();

        config(['app.install_token' => 'secret-code']);

        $this->postJson('/api/v1/install', $this->admin(['token' => 'wrong']))->assertUnprocessable()->assertJsonValidationErrors(['token']);
        $this->postJson('/api/v1/install', $this->admin(['token' => 'secret-code']))->assertCreated();
    }
}
