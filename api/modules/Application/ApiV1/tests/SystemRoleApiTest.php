<?php

namespace Origo\Application\ApiV1\Tests;

use App\Models\SystemRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Origo\Core\Project\Models\Project;
use Tests\TestCase;

class SystemRoleApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_admin_creates_a_pmo_role_whose_holders_create_and_see_every_project(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $roleId = $this->postJson('/api/v1/admin/system-roles', [
            'name' => ['vi' => 'PMO', 'ja' => null],
            'description' => ['vi' => 'Theo dõi mọi dự án', 'ja' => null],
            'permissions' => ['projects.create', 'projects.view_all', 'not-a-permission-is-rejected-below'],
        ])->assertUnprocessable()->json('data.id');
        $this->assertNull($roleId);

        $roleId = $this->postJson('/api/v1/admin/system-roles', [
            'name' => ['vi' => 'PMO', 'ja' => null],
            'permissions' => ['projects.create', 'projects.view_all'],
        ])->assertCreated()->assertJsonPath('data.key', 'pmo')->json('data.id');

        $pmo = User::factory()->create(['system_role_id' => $roleId]);
        Project::factory()->create(['code' => 'LMS']);
        Sanctum::actingAs($pmo);

        $this->getJson('/api/v1/me')->assertJsonPath('data.permissions', ['projects.create', 'projects.view_all'])->assertJsonPath('data.isAdmin', false);
        $this->getJson('/api/v1/projects')->assertJsonCount(1, 'data')->assertJsonPath('data.0.permissions.canEditPlan', false);
        $this->getJson('/api/v1/projects/LMS/plan')->assertOk()->assertJsonPath('data.canEdit', false);
        $this->postJson('/api/v1/projects', ['code' => 'NEW', 'name' => ['vi' => 'Mới'], 'description' => ['vi' => null]])->assertCreated();
        $this->getJson('/api/v1/projects/NEW/members')->assertOk()->assertJsonPath('data.0.role', 'manager');
        $this->getJson('/api/v1/admin/users')->assertForbidden();
    }

    public function test_every_role_is_editable_but_nobody_can_lock_the_system_out(): void
    {
        $admin = Sanctum::actingAs(User::factory()->admin()->create());
        $adminId = SystemRole::idFor(SystemRole::ADMIN);

        // Taking "manage settings" away from the only role that has it is refused and changes nothing.
        $this->patchJson("/api/v1/admin/system-roles/{$adminId}", ['name' => ['vi' => 'Siêu quản trị'], 'permissions' => ['users.manage']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('permissions');
        $this->assertContains('settings.manage', SystemRole::query()->find($adminId)->permissions);

        $this->patchJson("/api/v1/admin/system-roles/{$adminId}", ['name' => ['vi' => 'Siêu quản trị'], 'permissions' => ['settings.manage']])
            ->assertOk()
            ->assertJsonPath('data.name.vi', 'Siêu quản trị')
            ->assertJsonPath('data.permissions', ['settings.manage']);

        // A role in use, or the default one, cannot be deleted; an unused one can.
        $this->deleteJson("/api/v1/admin/system-roles/{$adminId}")->assertUnprocessable();
        $this->deleteJson('/api/v1/admin/system-roles/'.SystemRole::idFor(SystemRole::MEMBER))->assertUnprocessable();

        $customId = $this->postJson('/api/v1/admin/system-roles', ['name' => ['vi' => 'Tạm'], 'permissions' => [], 'isDefault' => true])
            ->assertJsonPath('data.isDefault', true)
            ->json('data.id');
        $this->assertFalse(SystemRole::query()->where('key', SystemRole::MEMBER)->value('is_default'));
        $this->deleteJson('/api/v1/admin/system-roles/'.SystemRole::idFor(SystemRole::MEMBER))->assertNoContent();

        $holder = User::factory()->create(['system_role_id' => $customId]);
        $this->deleteJson("/api/v1/admin/system-roles/{$customId}")->assertUnprocessable();
        $this->assertTrue($holder->fresh()->systemRole->is_default);
        $this->assertSame($admin->id, User::query()->whereHas('systemRole', fn ($role) => $role->whereJsonContains('permissions', 'settings.manage'))->value('id'));
    }

    public function test_people_without_settings_rights_cannot_change_roles(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/admin/system-roles')->assertForbidden();
        $this->postJson('/api/v1/admin/system-roles', ['name' => ['vi' => 'X'], 'permissions' => []])->assertForbidden();
    }
}
