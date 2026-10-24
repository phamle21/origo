<?php

namespace Origo\Application\ApiV1\Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_logs_in_with_a_token_and_reads_their_profile(): void
    {
        User::factory()->admin()->create(['email' => 'ba@origo.local', 'name' => 'Minh Anh', 'title' => 'BA']);

        $token = $this->postJson('/api/v1/auth/login', ['email' => 'BA@origo.local', 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('user.isAdmin', true)
            ->assertJsonPath('user.initials', 'MA')
            ->json('token');

        $this->withToken($token)->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.isActive', true);
    }

    public function test_a_wrong_password_is_rejected_without_saying_which_part_was_wrong(): void
    {
        User::factory()->create(['email' => 'dev@origo.local']);

        $this->postJson('/api/v1/auth/login', ['email' => 'dev@origo.local', 'password' => 'wrong'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_a_deactivated_account_cannot_sign_in_or_keep_using_its_token(): void
    {
        $user = User::factory()->create(['email' => 'dev@origo.local']);
        $token = $this->postJson('/api/v1/auth/login', ['email' => 'dev@origo.local', 'password' => 'password'])->json('token');

        $user->update(['is_active' => false]);

        $this->postJson('/api/v1/auth/login', ['email' => 'dev@origo.local', 'password' => 'password'])->assertUnprocessable();
        $this->withToken($token)->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_logging_out_revokes_the_token(): void
    {
        User::factory()->create(['email' => 'dev@origo.local']);
        $token = $this->postJson('/api/v1/auth/login', ['email' => 'dev@origo.local', 'password' => 'password'])->json('token');

        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertNoContent();

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/me')->assertUnauthorized();
    }
}
