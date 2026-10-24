<?php

namespace Origo\Application\ApiV1\Tests;

use App\Models\SystemRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Origo\Core\Project\Models\Project;
use Tests\TestCase;

class AdminUserApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_admin_creates_an_account_that_signs_in_with_the_temporary_password(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $response = $this->postJson('/api/v1/admin/users', ['name' => 'Lan', 'email' => 'Lan@Origo.local', 'title' => 'QA'])
            ->assertCreated()
            ->assertJsonPath('data.email', 'lan@origo.local')
            ->assertJsonPath('data.isAdmin', false)
            ->assertJsonPath('data.isActive', true);

        $this->app['auth']->forgetGuards();
        $this->postJson('/api/v1/auth/login', ['email' => 'lan@origo.local', 'password' => $response->json('temporaryPassword')])->assertOk();
    }

    public function test_an_admin_deactivates_an_account_and_its_sessions_end(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $user = User::factory()->create();
        $user->createToken('web');

        $this->patchJson("/api/v1/admin/users/{$user->id}", ['isActive' => false])->assertOk()->assertJsonPath('data.isActive', false);

        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_an_admin_cannot_lock_themselves_out(): void
    {
        $admin = Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/users/{$admin->id}", ['systemRoleId' => SystemRole::idFor(SystemRole::MEMBER)])->assertUnprocessable();
        $this->patchJson("/api/v1/admin/users/{$admin->id}", ['isActive' => false])->assertUnprocessable();
    }

    public function test_resetting_a_password_issues_a_new_one_and_signs_the_person_out(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $user = User::factory()->create(['email' => 'dev@origo.local']);
        $user->createToken('web');

        $password = $this->postJson("/api/v1/admin/users/{$user->id}/reset-password")->assertOk()->json('temporaryPassword');

        $this->assertSame(0, $user->tokens()->count());
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/v1/auth/login', ['email' => 'dev@origo.local', 'password' => $password])->assertOk();
    }

    public function test_members_cannot_manage_accounts(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/admin/users')->assertForbidden();
        $this->postJson('/api/v1/admin/users', ['name' => 'X', 'email' => 'x@origo.local'])->assertForbidden();
    }

    public function test_an_admin_sees_every_project_a_person_belongs_to(): void
    {
        $person = User::factory()->create();
        $lms = Project::factory()->create(['code' => 'LMS']);
        Project::factory()->create(['code' => 'HRM']);
        $lms->members()->create(['user_id' => $person->id, 'role' => 'qa']);
        $deleted = Project::factory()->create(['code' => 'OLD']);
        $deleted->members()->create(['user_id' => $person->id, 'role' => 'dev']);
        $deleted->delete();

        Sanctum::actingAs(User::factory()->admin()->create());
        $this->getJson('/api/v1/admin/users')->assertOk()->assertJsonPath('data.0.projectCount', fn ($count) => is_int($count));
        $this->getJson("/api/v1/admin/users/{$person->id}")->assertOk()->assertJsonPath('data.projectCount', 1);
        $this->getJson("/api/v1/admin/users/{$person->id}/projects")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.role', 'qa')
            ->assertJsonPath('data.0.project.code', 'LMS');

        Sanctum::actingAs($person);
        $this->getJson("/api/v1/admin/users/{$person->id}/projects")->assertForbidden();
    }

    public function test_an_admin_moves_a_person_to_another_role_but_the_last_admin_stays(): void
    {
        $admin = Sanctum::actingAs(User::factory()->admin()->create());
        $other = User::factory()->admin()->create();

        $this->patchJson("/api/v1/admin/users/{$other->id}", ['systemRoleId' => SystemRole::idFor(SystemRole::MEMBER)])
            ->assertOk()
            ->assertJsonPath('data.isAdmin', false)
            ->assertJsonPath('data.systemRole.key', 'member')
            ->assertJsonPath('data.permissions', []);

        $this->patchJson("/api/v1/admin/users/{$other->id}", ['systemRoleId' => SystemRole::idFor(SystemRole::ADMIN)])->assertOk();
        $this->patchJson("/api/v1/admin/users/{$admin->id}", ['isActive' => false])->assertUnprocessable();

        // With $admin acting, demoting $other would leave $admin as the only admin, which is allowed.
        $this->patchJson("/api/v1/admin/users/{$other->id}", ['isActive' => false])->assertOk();
    }
}
