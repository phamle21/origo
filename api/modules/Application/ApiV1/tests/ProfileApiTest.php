<?php

namespace Origo\Application\ApiV1\Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_person_renames_themselves_but_cannot_change_their_rights(): void
    {
        $user = User::factory()->create(['name' => 'Lan']);
        Sanctum::actingAs($user);

        $this->patchJson('/api/v1/me', ['name' => '  Lan Phạm ', 'isAdmin' => true, 'email' => 'x@y.z'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Lan Phạm')
            ->assertJsonPath('data.isAdmin', false);

        $this->assertSame($user->email, $user->refresh()->email);
    }

    public function test_changing_the_password_needs_the_current_one_and_signs_out_other_devices(): void
    {
        $user = User::factory()->create(['password' => 'old-password-1']);
        $user->createToken('laptop');
        $current = $user->createToken('phone');

        $this->withToken($current->plainTextToken)
            ->putJson('/api/v1/me/password', ['currentPassword' => 'wrong', 'password' => 'new-password-22', 'password_confirmation' => 'new-password-22'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('currentPassword');

        $this->withToken($current->plainTextToken)
            ->putJson('/api/v1/me/password', ['currentPassword' => 'old-password-1', 'password' => 'new-password-22', 'password_confirmation' => 'new-password-22'])
            ->assertNoContent();

        $this->assertTrue(Hash::check('new-password-22', $user->refresh()->password));
        $this->assertSame(['phone'], $user->tokens()->pluck('name')->all());
    }

    public function test_a_short_password_is_rejected(): void
    {
        Sanctum::actingAs(User::factory()->create(['password' => 'old-password-1']));

        $this->putJson('/api/v1/me/password', ['currentPassword' => 'old-password-1', 'password' => 'short', 'password_confirmation' => 'short'])
            ->assertJsonValidationErrors('password');
    }
}
